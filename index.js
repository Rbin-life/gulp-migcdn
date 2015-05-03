var fs = require('fs-extra'),
    path = require('path'),
    request = require('request'),
    lodash = require('lodash'),
    through = require('through2'),
    util = require('gulp-util'),
    PluginError = util.PluginError;

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

    // Creating a stream through which each file will pass
    return through.obj(function(file, enc, cb){

        var filepath = file.path;

        util.log('uploading...');

        fs.stat(filepath, function(err, stats){

            var fileType = path.extname(filepath),
                fileName = path.basename(filepath, fileType),
                fileSize = stats["size"];

            //拼接 URL
            var upload_url = options.upload_url + "?" +
                'appname=' + options.appname +
                '&user=' + options.user +
                '&filename=' + fileName +
                '&filetype=' + fileType.replace('.', '') +
                '&filepath=' + options.dest +
                '&filesize=' + fileSize +
                '&isunzip=' + options.isunzip;

            //读取文件流上传
            fs.createReadStream(filepath).pipe(request({
                method: 'POST',
                uri: upload_url,
                headers: {'X-CDN-Authentication': options.key}
            }, function(error, response, body){
                if(error){
                    util.colors.red("Network error：" + filepath + ", error message：" + JSON.stringify(error));
                }else if(response.statusCode === 200){
                    //上传成功
                    var bodyObj = JSON.parse(body);

                    if(bodyObj["ret_code"] !== 200){
                        util.log(JSON.stringify({file: filepath, 'msg': bodyObj["err_msg"], 'url': 'not found'}));
                    }else{
                        util.log('Success!');
                    }

                }else{
                    util.colors.red("Upolad error：" + filepath + JSON.stringify({
                        'msg': 'error',
                        'url': 'upload error, response status code is ' + response.statusCode
                    }));
                }
            }));

        });

        cb();
    });
}

// Exporting the plugin main function
module.exports = migCdn;