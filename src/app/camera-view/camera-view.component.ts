import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import DeviceDetector from 'device-detector-js'
import { Pose, Results, POSE_LANDMARKS, POSE_CONNECTIONS, POSE_LANDMARKS_LEFT, POSE_LANDMARKS_RIGHT, POSE_LANDMARKS_NEUTRAL, Options } from '@mediapipe/pose'
import { drawLandmarks, drawConnectors } from '@mediapipe/drawing_utils';
import { Camera } from '@mediapipe/camera_utils';



@Component({
  selector: 'app-camera-view',
  templateUrl: './camera-view.component.html',
  styleUrls: ['./camera-view.component.css']
})
export class CameraViewComponent implements AfterViewInit {
  @ViewChild('inputVideo', { static: false }) videoEl: ElementRef
  videoElement: HTMLVideoElement;
  @ViewChild('outputCanvas', { static: false }) canvasEl: ElementRef
  canvasElement: HTMLCanvasElement;
  @ViewChild('controlPanel', { static: false }) controlsEl: ElementRef
  controlsElement: HTMLDivElement;
  cameraRunning = false;
  cameraRecording = false;
  // @ViewChild('landmarkGridContainer', { static: false }) landmarkCont: ElementRef
  // landmarkContainer: HTMLDivElement;
  // grid;
  canvasCtx?: CanvasRenderingContext2D;
  activeEffect = 'mask';
  pose = new Pose({
    locateFile: (file) => {
      return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
    }
  });

  camera: Camera;

  constructor(private readonly cd: ChangeDetectorRef) { }

  // startRecording(stream, lengthInMS) {
  //   let recorder = new MediaRecorder(stream);
  //   let data = [];

  //   recorder.ondataavailable = (event) => data.push(event.data);
  //   recorder.start()

  //   let stopped = new Promise((resolve, reject) => {
  //     recorder.onstop = resolve;
  //     recorder.onerror = (event) => reject(event.name);
  //   })

  //   let recorded = wait(lengthInMS).then(
  //     () => {
  //       if (recorder.state === "recording") {
  //         recorder.stop();
  //       }
  //     }
  //   )
  // }

  ngAfterViewInit(): void {
    this.videoElement = this.videoEl.nativeElement;
    this.canvasElement = this.canvasEl.nativeElement;
    this.canvasCtx = this.canvasElement.getContext('2d')!;
    // this.landmarkContainer = this.landmarkCont.nativeElement;

    // console.log("CCC: ", this.canvasCtx)
    this.testSupport([{ client: 'Chrome' }])
    // this.pose.onResults(this.onResults)
    const options: Options = {
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      smoothSegmentation: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    }
    this.pose.setOptions(options);

    this.pose.onResults((res) => {
      this.onResults(res, this.canvasCtx)
    });

    // this.resizeAllTheThings()

    // this.camera.start()
  }

  @HostListener('window:resize', ['$event'])
  resizeAllTheThings() {
    console.log("called ", window.innerWidth, window.innerHeight)
    this.camera = new Camera(this.videoElement, {
      onFrame: async () => {
        await this.pose.send({ image: this.videoElement })
      },
      width: window.innerWidth,
      height: window.innerHeight
    })
    this.canvasElement.width = window.innerWidth
    this.canvasElement.height = window.innerHeight

    this.cd.detectChanges()

    this.camera.start()
    this.cameraRunning = true
  }

  stopCamera() {
    this.camera.stop()
    this.cameraRunning = false
  }

  testSupport(supportedDevices: { client?: string; os?: string; }[]) {
    const deviceDetector = new DeviceDetector();
    const detectedDevice = deviceDetector.parse(navigator.userAgent);

    let isSupported = false;
    for (const device of supportedDevices) {
      if (device.client !== undefined) {
        const re = new RegExp(`^${device.client}$`);
        if (detectedDevice.client) {
          if (!re.test(detectedDevice.client.name)) {
            continue;
          }
        }
      }
      if (device.os !== undefined) {
        const re = new RegExp(`^${device.os}$`);
        if (detectedDevice.os) {

          if (!re.test(detectedDevice.os.name)) {
            continue;
          }
        }
      }
      isSupported = true;
      break;
    }
    if (!isSupported && detectedDevice.client && detectedDevice.os) {
      alert(`This demo, running on ${detectedDevice.client.name}/${detectedDevice.os.name}, ` +
        `is not well supported at this time, expect some flakiness while we improve our code.`);
    }
  }

  onResults(results, canvasCtx) {
    // console.log("point: ", results.poseLandmarks)

    canvasCtx.save();
    canvasCtx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);

    canvasCtx.globalCompositeOperation = 'source-over';
    drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS,
      { color: '#ffffff', lineWidth: 2 });
    drawLandmarks(canvasCtx, results.poseLandmarks,
      { color: '#FFFFFF', lineWidth: 1 });
    canvasCtx.restore();
  }


}
