var fs = require('fs-extra'),
    path = require('path'),
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

    // Creating a stream through which each file will pass
    return through.obj(function(file, enc, cb){

        var filepath = file.path;

        console.log('开始上传：' + filepath);

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
                    console.log("网络错误：" + filepath + "，错误信息：" + JSON.stringify(error));
                }else if(response.statusCode === 200){
                    //上传成功
                    var bodyObj = JSON.parse(body);

                    if(bodyObj["ret_code"] !== 200){
                        console.log(JSON.stringify({file: filepath, 'msg': bodyObj["err_msg"], 'url': 'not found'}));
                    }else{
                        console.log(filepath + ' 上传成功！');
                    }

                }else{
                    console.log("上传错误：" + filepath + JSON.stringify({
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

