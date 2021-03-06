		navigator.getUserMedia = navigator.webkitGetUserMedia || navigator.getUserMedia;
		window.URL = window.URL || window.webkitURL;
		var w = 500;
		var h = 375;
		var app = document.getElementById('app');
		var video = document.querySelector('video');//.getElementById('monitor');
		var localMediaStream = null;
		
		var hs = 24;
		var delay = 1000/24;
		var history = [];
		var merged = getCanvas(w,h,"merged");
		document.body.appendChild(merged);
		var rgb = merged.getContext('2d');
		var dataLen = w*h*4;
		
		for(var i = 0; i < hs; i++) history[i] = getCanvas(w,h,'h'+i);
		//these following vars are only used in the choppy/stop motion version of this
		var rc = getCanvas(w,h,"rc");
		var gc = getCanvas(w,h,"gc");
		var bc = getCanvas(w,h,"bc");	
		var to = 500;
		var cc = 0;//channel count
		
		function getCanvas(w, h, id){
			var c = document.createElement('canvas');
			c.width = w;
			c.height = h;
			c.id = id;
			return c;
		}
		
		function gotStream(stream) {
			localMediaStream = stream;
		  if (window.URL) {
			video.src = window.URL.createObjectURL(stream);
		  } else {
			video.src = stream; // Opera.
		  }

		  video.onerror = function(e) {
			stream.stop();
		  };

		  stream.onended = noStream;
		 
		}

		function noStream(e) {
		  var msg = 'No camera available.';
		  if (e.code == 1) {
			msg = 'User denied access to use camera.';
		  }
		  alert(msg);
		}

		function update() {
			if(localMediaStream){
				var ctxCurr;
				//update history
				for(var i = hs-1; i > 0; i--){
					ctxCurr = history[i].getContext('2d');
					ctxCurr.clearRect(0, 0, w, h);
					ctxCurr.drawImage(history[i-1], 0, 0);
				}
				//write the most recent webcam frame
				var ctx0 = history[0].getContext('2d');
				ctx0.drawImage(video, 0, 0, w, h);
				ctx0.setTransform(-1,0,0,1,w,0);
				//get green and blue channels from history
				var g = history[hs/2].getContext('2d').getImageData(0, 0, w, h).data;
				var b = ctx0.getImageData(0, 0, w, h).data;
				//get a frame and it's pixels
				var imageData = history[hs-1].getContext('2d').getImageData(0, 0, w,h);
				var data = imageData.data;
				//write the green,blue channels using the offset frames
				for (var i = dataLen-1; i >= 0; i -= 4) {
					data[i + 1] = b[i+1];
					data[i + 2] = g[i+2];
				}
				rgb.putImageData(imageData, 0, 0);
			}
		}
		function copyPixels(){
			rc.getContext('2d').drawImage(video, 0, 0, w, h);
			if(cc % 1 == 0) gc.getContext('2d').drawImage(video, 0, 0, w, h);
			if(cc % 2 == 0) bc.getContext('2d').drawImage(video, 0, 0, w, h);
			cc++;
			setTimeout(copyPixels,to);
		}
		function init(el) {
		  if (!navigator.getUserMedia) {
			document.getElementById('errorMessage').innerHTML = 'Sorry. <code>navigator.getUserMedia()</code> is not available.';
			return;
		  }
		  navigator.getUserMedia({video: true}, gotStream, noStream);
		  setInterval(update,delay);
		  //setTimeout(copyPixels,to);
		}

		init(this);
