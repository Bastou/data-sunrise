
 // audio context 
 window.AudioContext=window.AudioContext||window.webkitAudioContext||window.mozAudioContext;


 var audioFile = 'lorn-acid-rain.mp3';
 /**
  *
  * Constantes
  *
  */  
  var EASING = 0.1
  var LINELENGTH = 20;
  var TRANSLATESTEP = 1 ;

  /*
   * Time stuff
   */
   var DELTA_TIME = 0;
   var LAST_TIME = Date.now();




   function SoundReact () {
     this.cv;
     this.ctx;
     this.cvS;
     this.linesArray = [];

     /*
     * Sound
     */
     this.audioCtx;
     this.audioBuffer;
     this.audioSource;
     this.analyser;
     this.frequencyData;
     this.frequencyDataFull;
     this.frequences;
   }

   SoundReact.prototype = {
     init: function(){
       this.cv = document.querySelector('canvas');
       this.ctx = this.cv.getContext('2d');
       this.ocv = document.createElement('canvas');
       this.octx = this.ocv.getContext('2d');
       this.onResize();
       this.loadSound();
     },
     loadSound: function(url) {
       var self = this;
       var request = new XMLHttpRequest();
       request.open('GET', audioFile, true);
       request.responseType = 'arraybuffer';

       // Decode asynchronously
       request.onload = function() {

         self.processAudio(request.response);

       }
       request.send();
     },
     processAudio: function (response) {
       var self = this;

       this.audioCtx = new AudioContext();
       this.analyser = this.audioCtx.createAnalyser();
       this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
       this.frequences = new Float32Array(2048);

       this.audioCtx.decodeAudioData(response, function(buffer) {

         // success callback
         self.audioBuffer = buffer;

         // Create sound from buffer
         self.audioSource = self.audioCtx.createBufferSource();
         self.audioSource.buffer = self.audioBuffer;

         // connect the audio source to context's output
         self.audioSource.connect( self.analyser )
         self.analyser.connect( self.audioCtx.destination )

         // play sound
         self.audioSource.start();

         self.render()

       }, function(){

         // error callback

       });
     },
     render: function () {

       this.frame();
       window.addEventListener( 'resize', this.onResize.bind(this) );
       rafId = requestAnimationFrame( this.frame.bind(this) );
     },
     frame: function () {
       var self = this;
       rafId = requestAnimationFrame( this.frame.bind(this) )

       DELTA_TIME = Date.now() - LAST_TIME;
       LAST_TIME = Date.now();


       this.analyser.getByteFrequencyData(this.frequencyData);

     


       var freq = Array.prototype.slice.call(this.frequencyData, 0, this.frequencyData.length);
       this.frequencyDataFull = freq.concat(freq.slice().reverse());

       //console.log(this.frequencyDataFull);


       /*
       var freq = Array.prototype.slice.call(this.frequencyData);
       var reversedFreq = freq.reverse();
       this.frequencyDataFull = reversedFreq.concat(freq);
       */

       this.drawFrequency(this.ctx, true)
       //this.drawFrequency(this.octx, false)

       //this.ctx.drawImage( this.ocv, 0, 10 );

       // Moyenne de tout
       // Déclencher un kick
       // average = cumul / 255;
     },


     drawFrequency: function(ctx, shouldClear) {

       ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
       if (shouldClear) ctx.clearRect( 0, 0, this.cvS[0], this.cvS[1] );

       // ctx.translate(0, TRANSLATESTEP);

       var nbLines = this.cvS[0] / LINELENGTH;

       var cumul = 0;
       var average = 0;
       var lines = [];

      

       ctx.strokeStyle = 'rgba(245, 245, 245, 0.9)';
       ctx.lineWidth = 2;
       ctx.moveTo(0, 0);
       //ctx.translate(0, TRANSLATESTEP);
     
       for ( var i = 0; i < nbLines; i += 2 ) {

         // get the frequency according to current i
         var percentIdx = i / nbLines;
         var frequencyIdx = Math.floor(2048 * percentIdx);

         this.frequences[frequencyIdx] += (this.frequencyDataFull[frequencyIdx] - this.frequences[frequencyIdx]) * EASING;
         
         //i == 0 ? console.log(this.frequencyData.reverse()) : '';
         lines.push([i * LINELENGTH, (this.cvS[1]/2 - this.frequences[frequencyIdx]) * 1.2]);

         //[x,y]

         //cumul += this.frequencyData[frequencyIdx];

       }

       //console.log(lines)


       addLimited(this.linesArray, lines, 60);



       for (var i = 0; i < this.linesArray.length; i++) {
         // remet la matrice de transformation courante à la matrice identité
         ctx.scale(1,1 + i * 0.01);
         
         ctx.beginPath();
         for (var j = 0; j < this.linesArray[i].length; j++) {
           
           ctx.lineTo(this.linesArray[i][j][0], this.linesArray[i][j][1]);

           //console.log(this.linesArray[i][j]);
         }
         //ctx.closePath();
         ctx.setTransform(1, 0, 0, 1, 0, 0);
         ctx.stroke();
       }

       //ctx.stroke();

     },


     onResize: function ( evt ) {

       this.cvS = [window.innerWidth, window.innerHeight]

       this.cv.width = this.cvS[0];
       this.cv.height = this.cvS[1];
       this.cv.style.width = this.cvS[0]; + 'px'
       this.cv.style.height = this.cvS[1]; + 'px';
       this.ocv.width = this.cvS[0];
       this.ocv.height = this.cvS[1];
       this.ocv.style.width = this.cvS[0]; + 'px'
       this.ocv.style.height = this.cvS[1]; + 'px'

     },
     render: function () {

       this.frame();
       window.addEventListener( 'resize', this.onResize.bind(this) );
       rafId = requestAnimationFrame( this.frame.bind(this) );
     }
   };


   soundReact = new SoundReact();
   soundReact.init();


/**
 *
 * Tools
 *
 */

 // map a range of numbers to another range of numbers
 Number.prototype.map = function(in_min, in_max, out_min, out_max) {
   return (this - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
 }

 function addLimited(arr, x, limit) {
     arr.unshift(x);
     if (arr.length > limit) {
         arr.length = limit;
     }
 }