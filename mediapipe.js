
import {
  HandLandmarker,
  FilesetResolver
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0"

const demosSection = document.getElementById("demos")

let handLandmarker = undefined
let runningMode = "IMAGE"
let enableWebcamButton
let webcamRunning = false

// Before we can use HandLandmarker class we must wait for it to finish
// loading. Machine Learning models can be large and take a moment to
// get everything needed to run.
const createHandLandmarker = async () => {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
  )
  handLandmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
      delegate: "GPU"
    },
    runningMode: runningMode,
    numHands: 2
  })
  demosSection.classList.remove("invisible")
}
createHandLandmarker();

/********************************************************************
// Demo 2: Continuously grab image from webcam stream and detect it.
********************************************************************/

const video = document.getElementById("webcam")
const canvasElement = document.getElementById("output_canvas")
const canvasCtx = canvasElement.getContext("2d")

// Check if webcam access is supported.
const hasGetUserMedia = () => !!navigator.mediaDevices?.getUserMedia;

// If webcam supported, add event listener to button for when user
// wants to activate it.
if (hasGetUserMedia()) {
// trigger the function to enable the webcam.
  setTimeout(enableCam,100);
} else {
  console.warn("getUserMedia() is not supported by your browser")
}

// Enable the live webcam view and start detection.
function enableCam(event) {
  if (!handLandmarker) {
    console.log("Wait! objectDetector not loaded yet.")
    return
  }

  if (webcamRunning === true) {
    webcamRunning = false
    // enableWebcamButton.innerText = "ENABLE PREDICTIONS"
  } else {
    webcamRunning = true
    // enableWebcamButton.innerText = "DISABLE PREDICTIONS"
  }

  // getUsermedia parameters.
  const constraints = {
    video: true
  }

  // Activate the webcam stream.
  navigator.mediaDevices.getUserMedia(constraints).then(stream => {
    video.srcObject = stream
    video.addEventListener("loadeddata", predictWebcam)
  })
}

/////////////////////////////
// Hand detection functions//
/////////////////////////////
let leftHand;
let rightHand;

let lastVideoTime = -1
let results = undefined
console.log(video)
async function predictWebcam() {
  canvasElement.style.width = video.videoWidth
  canvasElement.style.height = video.videoHeight
  canvasElement.width = video.videoWidth
  canvasElement.height = video.videoHeight

  // Now let's start detecting the stream.
  if (runningMode === "IMAGE") {
    runningMode = "VIDEO"
    await handLandmarker.setOptions({ runningMode: "VIDEO" })
  }
  let startTimeMs = performance.now()
  if (lastVideoTime !== video.currentTime) {
    lastVideoTime = video.currentTime
    results = handLandmarker.detectForVideo(video, startTimeMs)
  }
  canvasCtx.save()
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.beginPath();
  canvasCtx.moveTo(0, 0);

  if (results.landmarks) {
    for (const landmarks of results.landmarks) {
      //check if there are two hands
      if(results.landmarks.length == 2){
        //check which hand is left and which is right 
        //based on the x coordinate of the end of the index finger and the first nuckle of the pinky
        if(results.landmarks[0][8].x < results.landmarks[0][20].x){
          leftHand = results.landmarks[0][8];
          rightHand = results.landmarks[1][8];
        }else{
          leftHand = results.landmarks[1][8];
          rightHand = results.landmarks[0][8];
        }
        console.log("There are two hands");
        console.log("left hand " + ( leftHand.x)); 
        console.log("right hand " + ( rightHand.x)); 
        //Draw a rectangle.
        let boxLeftHandX = leftHand.x*canvasElement.width;
        let boxLeftHandY = leftHand.y*canvasElement.height;
        //boxRightHandX and boxRightHandY has to be offset with the x and y of the left hand
        //because the x and y of the right hand is startpoint of the rectangle 
        let boxRightHandX = (rightHand.x*canvasElement.width)-boxLeftHandX;
        let boxRightHandY = (rightHand.y*canvasElement.height)-boxLeftHandY;
        canvasCtx.fillStyle = "rgb(0 255 0 / 30%)";
        canvasCtx.fillRect(boxLeftHandX ,boxLeftHandY, boxRightHandX,boxRightHandY);


      }else{
        //check which hand is left and which is right 
        //based on the x coordinate of the end of the index finger and the first nuckle of the pinky
        if(results.landmarks[0][8].x < results.landmarks[0][20].x){
          console.log("left hand "+ (results.landmarks[0][8].x));
        }else{
          console.log("right hand "+ (results.landmarks[0][8].x));
        }
        
        
      }

      canvasCtx.stroke();
       
      
      drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {
        color: "#00FF00",
        lineWidth: 5
      })
      drawLandmarks(canvasCtx, landmarks, { color: "#FF0000", lineWidth: 2 })
    }
  }
  canvasCtx.restore()

  // Call this function again to keep predicting when the browser is ready.
  if (webcamRunning === true) {
    window.requestAnimationFrame(predictWebcam)
  }
}
