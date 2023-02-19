var video;
var scaler;
var preFrame;
var signals;
var speed = 1;

let brightnessThreshold = 25;

// A sound file object
let song1, song2, song3;

let osc, envelope, fft, reverb, synth, filter;

let scaleArray = [60, 62, 64, 65, 67, 69, 71, 72];
let note = 0;
let width = 320, height = 180;

function preload() {
  // Load a sound file
  song1 = loadSound('assets/ambient-loop-2.mp3');
  song2 = loadSound('assets/ambient-wave-1.mp3');
  song3 = loadSound('assets/retrowave-1.mp3');
}

function touchStarted() {
  console.log("Started")
  if (getAudioContext().state !== 'running') {
    getAudioContext().resume();
  }
  let el = document.getElementsByClassName('p5Canvas')[0];
  el.style.zoom = 3.2
  el.style.border = '1px solid red'
  webcam = devices.find(d => d.label.indexOf('C922') !== -1) || devices[0]
  console.log("Starting webcame", webcam)
  video = createCapture({
    video: {
      deviceId: {
        exact: webcam.id
      },
    }
  });

  // video = createCapture(VIDEO);
  video.size(width / scaler, height / scaler);
  // video.hide();
  preFrame = createImage(video.width, video.height);
  signals = new Uint8ClampedArray(video.width * video.height);

  console.log("sizes", width, height, video.width, video.height, signals)
}

const devices = [];

function gotDevices(deviceInfos) {
  for (let i = 0; i !== deviceInfos.length; ++i) {
    const deviceInfo = deviceInfos[i];
    if (deviceInfo.kind == 'videoinput') {
      devices.push({
        label: deviceInfo.label,
        id: deviceInfo.deviceId
      });
    }
  }
  console.log("Webcams", devices);
  let supportedConstraints = navigator.mediaDevices.getSupportedConstraints();
  console.log("supportedConstraints", supportedConstraints);

}

let allOscillators = [];
let allEnvelopes = [];
let allFilters = [];
let lastSynthIx = 0;

function createOscillators() {
  for (var j = 0; j < 50; j++) {
    let env = new p5.Envelope();
    env.setADSR(0.001, 0.2, 0.1, 0.5);
    env.setRange(2, 0);
    allEnvelopes.push(env);

    let filter = new p5.LowPass();
    allFilters.push(filter);

    let osc = new p5.SinOsc();
    osc.disconnect()
    osc.connect(filter);
    osc.amp(env);

    allOscillators.push(osc);

  }
}

function setup() {
  

  // let width = windowWidth, height = windowHeight;
  scaler = 5
  createCanvas(width, height);
  pixelDensity(1);

  navigator.mediaDevices.enumerateDevices()
  .then(gotDevices);

  createOscillators();


  song1.loop();
  // song2.loop();
  // song3.loop();
  
  song1.amp(1);
  song2.amp(0);
  song3.amp(0);
  

}

function draw() {
  if (!video) {
    return;
  }

  video.loadPixels(); // uint8array
  preFrame.loadPixels();

  // video hieght and width are the canvas / scaler.  so 
  // a 640 width canvas and 20 scaler, has a video width of 32.
  // the boxes are 
  let minspeed = video.width / 2;
  let maxspeed = video.width / 2;
  let totalDetected = 0
  for (let y = 0; y < video.height; y++) {
    for (let x = 0; x < video.width; x++) {
      let signalIx = x + y * video.width;
      var index = signalIx * 4;
      let pr = preFrame.pixels[index + 0];
      let pg = preFrame.pixels[index + 1];
      let pb = preFrame.pixels[index + 2];


      let r = video.pixels[index + 0];
      let g = video.pixels[index + 1];
      let b = video.pixels[index + 2];
            let pbright = (pr + pg + pb) / 3;
      let bright = (r + g + b) / 3;
	  // distance: 
      var diff = dist(r, g, b, pr, pg, pb);
      
	  if (diff < brightnessThreshold) {
        signals[signalIx] = signals[signalIx] * 0.95
        fill(
          signals[signalIx]*sqrt(Math.random()),
          signals[signalIx]*sqrt(Math.random()),
          signals[signalIx]*sqrt(Math.random())
        )
      } else {
        fill(120*diff, 0, 0);
        signals[signalIx] = 255;
        totalDetected += 1;
        minspeed = min(minspeed, x);
        maxspeed = max(maxspeed, x);
        // osc.freq(640*(1-y/video.height)+100);
        // envelope.play(osc, 0, 0.1)
        // let note = floor((1-y/video.height)*120)
        // synth.play(note, 0.6, 0, 0.2)
        if (!(frameCount % 2) && !(totalDetected % 2)) {
          allEnvelopes[lastSynthIx].setADSR(0.001, 0.1, (1-x/video.width)*0.5, (1-x/video.width)*1)
          allFilters[lastSynthIx].freq(100 + floor((1-y/video.height)*1000));
          allOscillators[lastSynthIx].start();
          allOscillators[lastSynthIx].freq(30 + floor((1-y/video.height)*2000));
          allEnvelopes[lastSynthIx].play();
          lastSynthIx = (lastSynthIx + 1) % allOscillators.length;

        }
        if (!frameCount % 30) {
            song1.rate((1-x/video.width)*3.8+0.3)
        }
      }
      noStroke();
      rect((video.width - x -1) * scaler, y * scaler, scaler, scaler);

      // brightnessThreshold = totalDetected < 30 
      //   ? max(brightnessThreshold*0.6, 30)
      //   : min(brightnessThreshold*1.3, 120)
      //   text(brightnessThreshold, 10, 10, 70, 80);
    }
  }
  
//    if (frameCount % 60 === 0 || frameCount === 1) {
//     let midiValue = scaleArray[note];
//     let freqValue = midiToFreq(midiValue);
//     osc.freq(freqValue);

//     envelope.play(osc, 0, 0.1);
//     note = (note + 1) % scaleArray.length;
//   }

    // Set the volume to a range between 0 and 1.0
  // let volume = map(mouseX, 0, width, 0, 1);
  // volume = constrain(volume, 0, 1);
//   song1.amp(0.2);
//   // song2.amp(0.1);

//   // Set the rate to a range between 0.1 and 4
//   // Changing the rate alters the pitch
//   // speed *= maxspeed/video.width
//   // speed = constrain(speed, 0.01, 4);
//   // let speed = 1.8
//   song1.rate(speed);

    preFrame.copy(video, 0, 0, video.width, video.height, 0, 0, video.width, video.height);

}