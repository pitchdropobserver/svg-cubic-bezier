import { 
	ease,
	purgeOwnKeys,
	getUniqueHashOnObj,
} from 'brodash'

interface IClockSubscriber {
	onUpdate: Function // update callback
	frequency: number // threshold (ms) to surpass before calling next update
	delay: number // theshold (ms) to surpass before initiating 1st update call
	last: DOMHighResTimeStamp // timestamp on previous frame
	start: DOMHighResTimeStamp // timestamp on 1st frame
}

let clock: ClockPoll
let dtSincePrev: number
let dtSince1st: number


const FPS_30 = 30
const MSPF = 1000 / FPS_30  // milliseconds per frame

class ClockPoll {

	private subscribers: Array<IClockSubscriber> = []

	constructor() {
		this.animFrameUpdate = this.animFrameUpdate.bind(this)
	}

	private animFrameUpdate(timeStamp: DOMHighResTimeStamp): void {
		// https://developer.mozilla.org/en-US/docs/Web/API/DOMHighResTimeStamp
		const { subscribers } = this
		subscribers.forEach((s: IClockSubscriber) => {
			if (s.start === undefined){
				s.start = timeStamp // mark animation start
				s.last = timeStamp
			}
			dtSince1st = timeStamp - s.start 
			dtSincePrev = timeStamp - s.last // calculate individual dt's for each subscriber
			if (
				dtSincePrev >= s.frequency
				&& dtSince1st > s.delay	
			) {
				const isCompleted = s.onUpdate(
					timeStamp, // current time
					dtSincePrev, // time since last onUpdate call
					dtSince1st - s.delay // time since 1st onUpdate call 
					)
				s.last = timeStamp
				if(isCompleted){
					this.unsubscribe(s)
				} 
			}
		})
		if (this.subscribers.length > 0){
			// keep animating if still subscribers in queue...
			requestAnimationFrame(this.animFrameUpdate)
		}
	}

	public subscribe(onUpdate: Function, frequency: number, delay: number = 0): number {
		const dup = this.subscribers.find(s => s.onUpdate === onUpdate)
		if (dup === undefined) { // if not already subscribed...
			this.subscribers.push({
				onUpdate,
				frequency,
				delay,
				last: undefined,
				start: undefined,
			})
		}
		if (this.subscribers.length === 1){
			// kickstart clock again if previous subscriber was the first...
			requestAnimationFrame(this.animFrameUpdate)
		}
		return this.subscribers.length
	}

	private unsubscribe(subscriber: IClockSubscriber): number {
		this.subscribers = this.subscribers.filter(s => s !== subscriber)
		return this.subscribers.length
	}
}



export interface ITweenState {
	[index: string]: number
}


const DEFAULT_ANIM_DUR = 1000
const DEFAULT_ANIM_DELAY = 0
const DEFAULT_FPS = 30
const DEFAULT_MSFPS = 1000 / DEFAULT_FPS

class Tween {
	// internal props...
	private id: string 
	private startState: ITweenState 
	private userStateObj: ITweenState 
	private stateDeltas: ITweenState 
	// user props...
	private animDur: number = DEFAULT_ANIM_DUR
	private msDelay: number = DEFAULT_ANIM_DELAY
	private msPerFrame: number = DEFAULT_MSFPS
	private easingFunction: Function = ease.InOutCubic
	private userOnUpdateCallback: Function 
	private userOnCompleteCallback: Function 

	constructor(userStateObj: ITweenState){
		this.startState = Object.assign({}, userStateObj)
		this.userStateObj = userStateObj
		this.update = this.update.bind(this)		
		return this
	}

	public to(endState: ITweenState, animDur: number = DEFAULT_ANIM_DUR): Tween {
		const { startState } = this
		this.animDur = animDur
		this.stateDeltas = Object.keys(startState).reduce((prev, key)=>{
			prev[key] = (endState[key] - startState[key]) 
			return prev
		},{})
		return this
	}
	
	public fps(framePerSec: number = DEFAULT_FPS): Tween {
		this.msPerFrame = 1000 / framePerSec
		return this
	}

	public delay(milli: number = DEFAULT_ANIM_DELAY): Tween {
		this.msDelay = milli
		return this
	}

	public easing(easeType: string = 'InOutCubic'): Tween {
		this.easingFunction = ease[easeType]
		return this
	}

	public onUpdate(callback: Function): Tween {
		this.userOnUpdateCallback = callback
		return this
	}
	
	public onComplete(callback: Function): Tween {
		this.userOnCompleteCallback = callback
		return this
	}
	
	public start(): Tween {
		const { update, msPerFrame, msDelay} = this
		if (clock === undefined) clock = new ClockPoll()
		clock.subscribe(update, msPerFrame, msDelay)
		return this
	}

	public update(timestamp: DOMHighResTimeStamp, dtSincePrev: number, dtSince1st: number,): boolean {
		const { animDur, easingFunction, userStateObj, startState, stateDeltas } = this
		const pctTimeElapsed = Math.min(dtSince1st / animDur, 1.0)
		// console.log('pctTimeElapsed', pctTimeElapsed)
		Object.keys(userStateObj).forEach((key) => {
			userStateObj[key] = startState[key] + (stateDeltas[key] * easingFunction(pctTimeElapsed))
		})

		this.userOnUpdateCallback()

		// on animation complete...
		if (pctTimeElapsed === 1.0) {
			const { userOnCompleteCallback: onCompleteCallback } = this
			if (onCompleteCallback !== undefined) {
				onCompleteCallback()
			}
			return true
		}
	}

}

export default Tween