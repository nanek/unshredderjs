var UNSHREDDER = (function() {
  var img_width, img_height, sliceWidth = 32, canvas1, canvas2;

  function getImageSlice(canvas, num, height) {
    return canvas.getImageData(num*sliceWidth, 0, sliceWidth, height);
  }

  function putImageSlice(canvas, imageData, pos) {
    canvas.putImageData(imageData, pos*sliceWidth, 0);
  }

  function compareColor(rgb,rgb2) {
    return (Math.abs(rgb.r-rgb2.r) < 20 &&
            Math.abs(rgb.g-rgb2.g) < 20 &&
            Math.abs(rgb.b-rgb2.b) < 20);
  }

  function compareSides(s1, s2) {
    var numSame = 0;
    var xp = s1.data;
    var yp = s2.data;

    //for each row
    var i = 0;
    for (i; i < s1.height; i++) {
      var rm = (i+1)*sliceWidth*4 - 4;
      if (i===0) { rm = sliceWidth*4 -4; }
      var lm = i*sliceWidth*4;
      numSame += compareColor({r:xp[rm],g:xp[rm+1],b:xp[rm+2]}
                             ,{r:yp[lm],g:yp[lm+1],b:yp[lm+2]});
    }
    return numSame;
  }

  function sortByLeft(left_slice, some_slices) {
    var shredded_slices = some_slices.slice(0);
    var total_slices = shredded_slices.length;
    var total_similar = 0;
    var slices = [];
    var s = 0;
    for (s=0; s<total_slices; s++) {
      if (s===0) {
        slices.push(shredded_slices.splice(left_slice,1));
      } else { 
        var max_similar = 0;
        var best_match = 0;
        var t = 0;
        for (t; t<shredded_slices.length; t++) {
          //compare last matched slice to remaining slices
          var similar = compareSides(slices[s-1][0], shredded_slices[t]);
          if (similar > max_similar) {
            max_similar = similar;
            best_match=t;
            total_similar += similar;
          }
        }
        slices.push(shredded_slices.splice(best_match,1));
      }
    }
    return { slices: slices, total_similar: total_similar };
  }

  function unshred(image_id, fn){
    var image = document.getElementById(image_id);
    
    //add unshredded image to canvas
    ctx = canvas1.getContext('2d');
    ctx.drawImage(image, 0, 0);

    var total_slices = Math.abs(img_width/sliceWidth);
    var shredded_slices = [];
    var s = 0;
    for (s=0; s<total_slices; s++) {
      shredded_slices.push(getImageSlice(ctx, s, img_height));
    }

    //sort the images, trying each slice on the left most side
    var attempt = 0;
    var best_attempt;
    var best_attempt_total = 0;
    for (attempt=0; attempt<total_slices; attempt++) { 
      var an_attempt = sortByLeft(attempt, shredded_slices);
      if (an_attempt.total_similar > best_attempt_total) {
        best_attempt_total = an_attempt.total_similar;
        best_attempt = an_attempt.slices;
      }
    }

    // draw best attempt on working canvas
    ctx2 = canvas2.getContext('2d');
    var w = 0;
    for (w; w<best_attempt.length; w++){
      putImageSlice(ctx2, best_attempt[w][0], w);
    }

    // return image element
    fn(createPNG(canvas2));
  }

  function createPNG(canvas) {
    var imgElement = document.createElement("img");
    imgElement.src = canvas.toDataURL("image/png");
    return imgElement;
  }

  function createCanvas(id, width, height, hidden) {
    var newCanvas = document.createElement('canvas');
    newCanvas.id = id;
    newCanvas.height=height;
    newCanvas.width=width;
    if (hidden) {
      newCanvas.style.cssText="display:none;";
    }
    document.body.appendChild(newCanvas);
    return document.getElementById(id);
  }

  return {
    init: function(sWidth, imgWidth, imgHeight) {
      sliceWidth = sWidth;
      img_width= imgWidth;
      img_height= imgHeight;
      canvas1 = createCanvas('c1', img_width, img_height, true);
      canvas2 = createCanvas('c2', img_width, img_height, true);
    },
    unshred: unshred
  };
}());
