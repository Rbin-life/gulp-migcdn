var path = require('path'),
    request = require('request'),
    lodash = require('lodash'),
    through = require('through2'),
    gutil = require('gulp-util'),
    PluginError = gutil.PluginError;

function migCdn(options){
    if(!options){
        throw new PluginError(gulp-migcdn, 'Missing options');
    }

    options = lodash.extend({
        upload_url: '',
        appname: '',
        user: '',
        key: '',
        dest: '',
        isunzip: 1
    }, options);

    var fileCount = 0;

    // Creating a stream through which each file will pass
    return through.obj(function(file, enc, cb){

        var filepath = file.path,
            fileType = path.extname(filepath),
            fileName = path.basename(filepath, fileType),
            fileSize = file.contents.length;

        //拼接 URL
        var upload_url = options.upload_url + "?" +
            'appname=' + options.appname +
            '&user=' + options.user +
            '&filename=' + fileName +
            '&filetype=' + fileType.replace('.', '') +
            '&filepath=' + options.dest.replace(/\\/g, '/') +
            '&filesize=' + fileSize +
            '&isunzip=' + options.isunzip;

        var self = this;

        gutil.log('uploading...');

        //读取文件流上传
        file.pipe(request({
            method: 'POST',
            uri: upload_url,
            headers: {
                'X-CDN-Authentication': options.key,
                'Content-Length': fileSize
            }
        }, function(error, response, body){

            if(error){
                gutil.colors.red("Network error：" + filepath + ", error message：" + JSON.stringify(error));
            }else if(response.statusCode === 200){
                //上传成功
                var bodyObj = JSON.parse(body);

                if(bodyObj["ret_code"] !== 200){
                    gutil.log(JSON.stringify({file: filepath, 'msg': bodyObj["err_msg"], 'url': 'not found'}));
                }else{
                    fileCount++;
                    self.push(file);
                    cb();
                }
            }else{
                gutil.colors.red("Upolad error：" + filepath + JSON.stringify({
                    'msg': 'error',
                    'url': 'upload error, response status code is ' + response.statusCode
                }));
            }
        }));
    }, function (cb) {
        if (fileCount > 0) {
            gutil.log('gulp-migcdn:', gutil.colors.green(fileCount, fileCount === 1 ? 'file' : 'files', 'uploaded successfully'));
        } else {
            gutil.log('gulp-migcdn:', gutil.colors.yellow('No files uploaded'));
        }

        cb();
    });
}

// Exporting the plugin main function
module.exports = migCdn;
