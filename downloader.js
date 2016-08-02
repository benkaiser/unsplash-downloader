require('dotenv').config();
var async = require('async');
var mkdirp = require('mkdirp');
var fs = require('fs');
var path = require('path');
var request = require('request');
var unsplashHeaders = [
  {
    name: 'Client-ID',
    value: process.env.UNSPLASH_APP_ID,
  },
];

class Downloader {
  constructor() {
    mkdirp('photos');
  }

  fetchPhotos() {
    var page = 1;
    async.forever(function (done) {
      var url = this.getURL(page++);
      console.log('fetching:' + url);
      request({
        method: 'GET',
        url: url,
      }, function (err, response, body) {
        if (err) {
          console.log(err);
        } else {
          var photos = JSON.parse(body);
          async.each(photos, this.downloadPhoto.bind(this), done);
        }
      }.bind(this));
    }.bind(this));
  }

  downloadPhoto(photoInfo, done) {
    if (this.isRightSize(photoInfo)) {
      fs.exists(this.photoFilename(photoInfo), function (exists) {
        if (exists) {
          console.log('Skipping: ' + photoInfo.id);
          done();
        } else {
          request(this.photoURL(photoInfo))
          .on('response', function () {
            console.log('Downloaded: ' + photoInfo.id);
            done();
          })
          .on('error', done)
          .pipe(fs.createWriteStream(this.photoFilename(photoInfo)));
        }
      }.bind(this));
    } else {
      console.log('Skipping (wrong size): ' + photoInfo.id);
      done();
    }
  }

  getURL(page) {
    return 'https://api.unsplash.com/photos/curated?page=' + page +
           '&client_id=' + process.env.UNSPLASH_APP_ID;
  }

  isRightSize(photoInfo) {
    return photoInfo.width > photoInfo.height &&
           photoInfo.width > 2560;
  }

  photoURL(photoInfo) {
    return photoInfo.urls.regular.replace('1080', process.env.WIDTH_NEEDED);
  }

  photoFilename(photoInfo) {
    return path.join('photos', photoInfo.id + '.jpg');
  }
}
module.exports = Downloader;
