var video;
var preFrame;
var signals;
var speed = 1;

let brightnessThreshold = 5;

// A sound file object
let song1, song2, song3;

let osc, envelope, fft, reverb, synth, filter;

let scaleArray = [60, 62, 64, 65, 67, 69, 71, 72];
let note = 0;
let width = 960,
  height = 480;
var scaler = 12;
let zoom = 1.4;

let started = false;

function preload() {}

function touchStarted() {
  console.log("Started");
  if (getAudioContext().state !== "running") {
    getAudioContext().resume();
  }
  let el = document.getElementsByClassName("p5Canvas")[0];
  el.style.zoom = zoom;
  //el.style.transform = 'scaleX(-1)'
  el.style.border = "1px solid red";
  webcam = devices.find((d) => d.label.indexOf("C922") !== -1) || devices[0];
  console.log("Starting webcame", webcam);
  video = createCapture({
    video: {
      deviceId: {
        exact: webcam.id,
      },
    },
  });

  // video = createCapture(VIDEO);
  video.size(width / scaler, height / scaler);
  // video.hide();
  preFrame = createImage(video.width, video.height);
  signals = new Uint8ClampedArray(video.width * video.height);

  console.log("sizes", width, height, video.width, video.height, signals);
  started = true;
}

const devices = [];

function gotDevices(deviceInfos) {
  for (let i = 0; i !== deviceInfos.length; ++i) {
    const deviceInfo = deviceInfos[i];
    if (deviceInfo.kind == "videoinput") {
      devices.push({
        label: deviceInfo.label,
        id: deviceInfo.deviceId,
      });
    }
  }
  console.log("Webcams", devices);
  let supportedConstraints = navigator.mediaDevices.getSupportedConstraints();
  console.log("supportedConstraints", supportedConstraints);
}

var video;

var preFrame;
var signals;
var speed = 1;

let img0;

function preload() {
  // Load a sound file
  img0 = loadImage(
    "assets/cheshire.png",
    () => {
      console.log(1);
    },
    (err) => {
      console.log(2, err);
    }
  );
}

function setup() {
  createCanvas(width, height);
  pixelDensity(1);
  video = createCapture(VIDEO);
  video.size(width / scaler, height / scaler);
  video.hide();
  preFrame = createImage(video.width, video.height);
  signals = new Uint8ClampedArray(video.width * video.height);
  // song1.loop();
  // song2.loop();
  // song3.loop();

  // song1.amp(0);
  // song2.amp(0);
  // song3.amp(0);

  osc = new p5.SqrOsc();

  synth = new p5.PolySynth();
  synth.setADSR(0.001, 0.05, 0.2, 0.1);

  // Instantiate the envelope
  envelope = new p5.Envelope();

  // set attackTime, decayTime, sustainRatio, releaseTime
  envelope.setADSR(0.001, 0.1, 0.5, 0.5);

  // set attackLevel, releaseLevel
  envelope.setRange(1, 0);
  // osc.disconnect()
  // reverb = new p5.Reverb();
  // osc.start();

  filter = new p5.LowPass();

  // Disconnect soundfile from master output.
  // Then, connect it to the filter, so that we only hear the filtered sound
  // soundFile.disconnect();
  // soundFile.connect(filter);

  createOscillators();
}

let allOscillators = [];
let allEnvelopes = [];
let allFilters = [];
let lastSynthIx = 0;

function createOscillators() {
  for (var j = 0; j < 50; j++) {
    let env = new p5.Envelope();
    env.setADSR(0.001, 2, 0.4, 0.5);
    env.setRange(2, 0);
    allEnvelopes.push(env);

    let filter = new p5.LowPass();
    allFilters.push(filter);

    let osc = new p5.SinOsc();
    osc.disconnect();
    osc.connect(filter);
    osc.amp(env);

    allOscillators.push(osc);
  }
}

// scales:

var majorSteps = [
  -12, -10, -8, -7, -5, -3, -1, 0, 2, 4, 5, 7, 9, 11, 12, 14, 16, 17, 19, 21,
  23, 24,
];
var minorSteps = [
  -24, -22, -21, -19, -17, -16, -14, -12, -10, -9, -7, -5, -4, -2, 0, 2, 3, 5,
  7, 8, 10, 12, 14, 15, 17, 19, 20, 22, 24,
];

var wholeNoteScale = [
  -24, -22, -20, -18, -14, -12, -10, -8, -6, -4, -2, 0, 2, 4, 6, 8, 10, 12, 14,
  16, 18, 20, 22, 24, 26, 28, 30, 32,
];

let catX = 100,
  catY = 100,
  catRot = 0,
  catDim = 0.5,
  catOpc = 1,
  catFlip = true;

const catChance = 0.01;// 0.003;

function draw() {
  // choose scale:
  var ix = Math.floor(Date.now() / 1000 / 10) % 3;
  var scaleNotes = ix == 2 ? majorSteps : ix == 1 ? minorSteps : wholeNoteScale;
  var numNotes = scaleNotes.length;

  video.loadPixels(); // uint8array
  preFrame.loadPixels();

  // video height and width are the canvas / scaler.  so
  // a 640 width canvas and 20 scaler, has a video width of 32.
  // the boxes are
  let minspeed = video.width / 2;
  let maxspeed = video.width / 2;
  let totalDetected = 0;
  for (let y = 0; y < video.height; y++) {
    for (let x = 0; x < video.width; x++) {
      let signalIx = x + y * video.width;
      var index = signalIx * 4;
      let pr = preFrame.pixels[index + 0];
      let pg = preFrame.pixels[index + 1];
      let pb = preFrame.pixels[index + 2];
      // let pbright = (pr + pg + pb) / 3;

      let r = video.pixels[index + 0];
      let g = video.pixels[index + 1];
      let b = video.pixels[index + 2];
      // let bright = (r + g + b) / 3;

      // distance:
      var diff = dist(r, g, b, pr, pg, pb);

      if (diff < 60) {
        signals[signalIx] = signals[signalIx] * 0.85;
        if (ix == 0) {
          fill(
            signals[signalIx] * sqrt(Math.random()),
            0,
            signals[signalIx] * sqrt(Math.random() * 1.3)
          );
        } else if (ix == 1) {
          fill(signals[signalIx] * sqrt(Math.random() * 1.4), 0, 0);
        } else {
          fill(
            0,
            signals[signalIx] * sqrt(Math.random() * 1.4),
            signals[signalIx] * sqrt(Math.random())
          );
        }
      } else {
        fill(120 * diff, 0, 0);
        signals[signalIx] = 255;
        totalDetected += 1;
        minspeed = min(minspeed, x);
        maxspeed = max(maxspeed, x);

        // play one of the oscillators
        if (frameCount % 4 && totalDetected % 2) {
          allEnvelopes[lastSynthIx].setADSR(
            0.001,
            0.2 * (1 - x / video.width),
            (1 - x / video.width) * 4,
            (1 - x / video.width) * 0.4
          );
          allFilters[lastSynthIx].freq(
            100 + floor((1 - x / video.width) * 1000)
          );
          allOscillators[lastSynthIx].start();
          // allOscillators[lastSynthIx].freq(
          //   10 + floor((1 - y / video.height) * 1000)
          // );
          // 0,2,3,5,7,8,10 <-- minor
          // octaves: 5

          var noteNum = floor(lerp(0, numNotes, 1 - y / video.height));

          allOscillators[lastSynthIx].freq(
            440 * 2 ** (scaleNotes[noteNum] / 12)
          );
          // allOscillators[lastSynthIx].freq(
          //   440*(2**(floor(lerp(-30, 50, (1 - y / video.height)))/12))
          // )
          // if (frameCount % 120) {
          //   console.log(
          //     (1 - y / video.height),
          //     lerp(-36, 40, (1 - y / video.height)),
          //     440*2**(floor(lerp(-25, 50, (1 - y / video.height))/12))
          //   )
          // }
          allEnvelopes[lastSynthIx].play();
          lastSynthIx = (lastSynthIx + 1) % allOscillators.length;
        }
      }
      noStroke();
      rect(
        (video.width - x - 1) * scaler,
        (y) * scaler,
        scaler, //* Math.random(),
        scaler //* Math.random()
      );
    }
    // image(img0, 0, 0);
    // blend(img0, 0, 0, 33, 100, 67, 0, 33, 100, ADD);
  }
  if (catX > 0) {
    tint(255, catOpc * 255);
    push();
    translate(catX, catY);
    imageMode(CENTER);
    rotate(catRot);
    scale(catFlip ? -1 : 1, 1);
    image(img0, 0, 0, img0.width * catDim, img0.height * catDim);
    pop();
    // image(
    //   img0,
    //   catX,
    //   catY,
    //   img0.width * catDim,
    //   img0.height * catDim,
    // );

    if (catOpc < 0.1) {
      catX = -1;
      catOpc = 1;
    } else {
      catOpc *= 0.97;
    }
  } else if (Math.random() < catChance) {
    catDim = 0.1 + Math.random() * 0.5;
    catX = (20 + (width - img0.width * catDim - 20)) * Math.random();
    catY = (20 + (height - img0.height * catDim - 20)) * Math.random();
    
    catOpc = 1;
    catRot = Math.PI*Math.random();
    catFlip = Math.random() > 0.5;
  }

  preFrame.copy(
    video,
    0,
    0,
    video.width,
    video.height,
    0,
    0,
    video.width,
    video.height
  );
}
