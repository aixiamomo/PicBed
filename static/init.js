// 全局变量 login_status: 用户登录状态, current_page: 当前页数, favourite_status: 已生成网址收藏状态, favourites_count: 收藏夹计数, favourites_open_status: 收藏夹开启状态
var login_status, current_page = 1, favourite_status = false, favourites_count, favourites_open_status = false;
// flash 消息插件 Messenger 初始化配置
Messenger.options = {
    parentLocations: ['#flash_messages'],
    'maxMessages': 2,
    extraClasses: 'messenger-on-top messenger-on-right',
    theme: 'air'
};
// 设置点击导航栏链接后自动收回
$(".nav > li > a").click(function () {
    $('#collapse').addClass("collapsed").attr("aria-expanded", false);
    $("#bs-example-navbar-collapse-1").removeClass("in");
    $("bs-example-navbar-collapse-1").attr("aria-expanded", false);
});
// 页面载入完成时初始化
$('#url-form-container').show();
$('#short-url-container').hide();
$('#signup-form-container').hide();
$('#signin-form-container').hide();
$('#favourites-container').hide();
// 查询用户登录状态
$.ajax({
    url: '/api/v1/session',
    type: 'GET',
    dataType: 'json',
    timeout: 5000,
    success: function (data) {
        if (data.r == 0) {
            $('li.anonymous-navbar').hide();
            $('#user-profile-button').html(data.user.username + "的个人中心");
            $('#favourites-toggle-button').html("打开收藏夹" + '<span class="badge">' + data.user.favouritesCount + '条记录</span>')
            login_status = true;
            favourites_count = data.user.favouritesCount;
        } else if (data.r == 1) {
            $('li.logged-in-navbar').hide();
            $('#favourites-toggle-button').html("打开收藏夹").hide();
            login_status = false;
        }
    },
    error: function () {
        $('li.logged-in-navbar').hide();
        $('#favourites-toggle-button').hide();
        Messenger().post({
            id: 'error-out-of-time',
            type: 'error',
            message: '与服务器通信出现问题，初始化失败，请尝试刷新页面',
            showCloseButton: true
        });
    }
});
$(function () {
    // 自定义jQuery函数转换表单内容成JSON字符串
    $.fn.serializeObject = function () {
        var o = {};
        var a = this.serializeArray();
        $.each(a, function () {
            if (o[this.name]) {
                if (!o[this.name].push) {
                    o[this.name] = [o[this.name]];
                }
                o[this.name].push(this.value || '');
            } else {
                o[this.name] = this.value || '';
            }
        });
        return o;
    };
    // AJAX请求 生成短网址
    $('#url-submit-button').click(function () {
        // TODO 生成短网址表单验证
        $('#url-submit-button').attr("disabled", "disabled").html('<i class="icon-refresh icon-spin"></i>' + " 正在生成");
        $.ajax({
            url: '/api/v1/urls',
            contentType: "application/json; charset=utf-8",
            data: JSON.stringify($('#url-form').serializeObject()),
            type: 'POST',
            dataType: 'json',
            timeout: 5000,
            success: function (data) {
                $('#url-submit-button').removeAttr("disabled").html("生成");
                if (data.r == 0) {
                    favourite_status = data.is_favouriting;
                    $('#short-url-container').show();
                    $('#short-url-field').attr("value", data.url.shortURL);
                    if (favourite_status == true) {
                        $('#add-to-favourites-button').html('<i class="icon-bookmark"></i>');
                    } else if (favourite_status == false) {
                        $('#add-to-favourites-button').html('<i class="icon-bookmark-empty"></i>');
                    }
                    Messenger().post({
                        id: 'successful-shorted-url',
                        type: data.message[0],
                        message: data.message[1],
                        showCloseButton: true
                    });
                } else if (data.r == 1) {
                }
            },
            error: function () {
                $('#url-submit-button').removeAttr("disabled").html("生成");
                Messenger().post({
                    id: 'error-out-of-time',
                    type: 'error',
                    message: '与服务器通信出现问题，请重试',
                    showCloseButton: true
                });
            }
        });
    });
    // AJAX请求 添加删除收藏
    $('#add-to-favourites-button').click(function () {
        var req = {};
        req.shortURL = $('#short-url-field').val();
        if (login_status == false) {
            Messenger().post({
                id: 'error-anonymous-add-to-favourites-button',
                type: 'error',
                message: '请先登录再使用收藏功能',
                showCloseButton: true
            });
        } else if (login_status == true && favourite_status == false) {
            $('#add-to-favourites-button').attr("disabled", "disabled").html('<i class="icon-refresh icon-spin"></i>');  // 禁用按钮 变为通信状态
            // 添加收藏
            $.ajax({
                url: '/api/v1/user/favourites',
                contentType: "application/json; charset=utf-8",
                data: JSON.stringify(req),
                timeout: 5000,
                type: 'POST',
                dataType: 'json',
                success: function (data) {
                    if (data.r == 0) {  // r==0时成功添加到收藏夹
                        $('#add-to-favourites-button').removeAttr("disabled").html('<i class="icon-bookmark"></i>');
                        if ( favourites_open_status == false ) {
                            $('#favourites-toggle-button').html("打开收藏夹" + '<span class="badge">' + data.user.favouritesCount + '条记录</span>');
                        } else if ( favourites_open_status == true ) {
                            // TODO 收藏夹处于打开状态时，增加收藏应该相应修改收藏夹
                        }
                        favourite_status = true;
                        favourites_count = data.user.favouritesCount;
                        Messenger().post({
                            id: 'successful-add-add-to-favourites-button',
                            type: data.message[0],
                            message: data.message[1],
                            showCloseButton: true
                        });
                    }
                },
                error: function () {
                    $('#add-to-favourites-button').removeAttr("disabled").html('<i class="icon-bookmark-empty"></i>');
                    Messenger().post({
                        id: 'error-out-of-time',
                        type: 'error',
                        message: '与服务器通信出现问题，请重试',
                        showCloseButton: true
                    });
                }
            });
        } else if (login_status == true && favourite_status==true){
            // 删除收藏
            $('#add-to-favourites-button').attr("disabled", "disabled").html('<i class="icon-refresh icon-spin"></i>');  // 禁用按钮 变为通信状态
            $.ajax({
                url: '/api/v1/user/favourites',
                contentType: "application/json; charset=utf-8",
                data: JSON.stringify(req),
                timeout: 5000,
                type: 'DELETE',
                dataType: 'json',
                success: function (data) {
                    if (data.r == 0) {  // r==0时成功从收藏夹删除
                        $('#add-to-favourites-button').removeAttr("disabled").html('<i class="icon-bookmark-empty"></i>');
                        if ( favourites_open_status == false ) {
                            $('#favourites-toggle-button').html("打开收藏夹" + '<span class="badge">' + data.user.favouritesCount + '条记录</span>');
                        } else if ( favourites_open_status == true ) {
                            // TODO 收藏夹处于打开状态时，删除收藏应该相应修改收藏夹
                        }
                        favourite_status = false;
                        favourites_count = data.user.favouritesCount;
                        Messenger().post({
                            id: 'successful-delete-add-to-favourites-button',
                            type: data.message[0],
                            message: data.message[1],
                            showCloseButton: true
                        });
                    }
                },
                error: function () {
                    $('#add-to-favourites-button').removeAttr("disabled").html('<i class="icon-bookmark"></i>');
                    Messenger().post({
                        id: 'error-out-of-time',
                        type: 'error',
                        message: '与服务器通信出现问题，请重试',
                        showCloseButton: true
                    });
                }
            });
        }
    });
    // AJAX请求 转到已生成的短网址
    $('#redirect-to').click(function () {
        window.open($('#short-url-field').val());
    });
    // AJAX请求 登入
    $('#signin-submit-button').click(function () {
        // TODO 登入表单验证
        $('#signin-submit-button').attr("disabled", "disabled").html('<i class="icon-refresh icon-spin"></i>' + " 正在登入");
        $.ajax({
            url: '/api/v1/session',
            contentType: "application/json; charset=utf-8",
            data: JSON.stringify($('#signin-form').serializeObject()),
            type: 'POST',
            dataType: 'json',
            timeout: 5000,
            success: function (data) {
                $('#signin-submit-button').removeAttr("disabled").html("登入");
                if (data.r == 0) {
                    login_status = true;
                    favourites_count = data.user.favouritesCount;
                    $('li.anonymous-navbar').hide();
                    $('li.logged-in-navbar').show();
                    $('#user-profile-button').html(data.user.username + "的个人中心");
                    $('#signin-form-container').hide();
                    $('#url-form-container').show();
                    $('#favourites-toggle-button').show().html("打开收藏夹" + '<span class="badge">' + data.user.favouritesCount + '条记录</span>');
                    Messenger().post({
                        id: 'successful-signed-in',
                        type: data.message[0],
                        message: data.message[1],
                        showCloseButton: true
                    });
                } else if (data.r == 1) {
                    Messenger().post({
                        id: 'error-wrong-password-or-username',
                        type: data.message[0],
                        message: data.message[1],
                        showCloseButton: true
                    });
                } else if (data.r == 2) {
                    Messenger().post({
                        id: 'error-invalid-password-or-username',
                        type: data.message[0],
                        message: data.message[1],
                        showCloseButton: true
                    });
                }
            },
            error: function () {
                Messenger().post({
                    id: 'error-out-of-time',
                    type: 'error',
                    message: '与服务器通信出现问题，请重试',
                    showCloseButton: true
                });
            }
        });
    });
    // AJAX请求 注册
    $('#signup-submit-button').click(function () {
        // TODO 注册表单验证
        $('#signup-submit-button').attr("disabled", "disabled").html('<i class="icon-refresh icon-spin"></i>' + " 正在注册");
        $.ajax({
            url: '/api/v1/user',
            contentType: "application/json; charset=utf-8",
            data: JSON.stringify($('#signup-form').serializeObject()),
            type: 'POST',
            dataType: 'json',
            timeout: 5000,
            success: function (data) {
                $('#signup-submit-button').removeAttr("disabled").html("注册");
                if (data.r == 0) {
                    login_status = true;
                    favourites_count = data.user.favouritesCount;
                    $('li.anonymous-navbar').hide();
                    $('li.logged-in-navbar').show();
                    $('#user-profile-button').html(data.user.username + "的个人中心");
                    $('#signup-form-container').hide();
                    $('#url-form-container').show();
                    $('#favourites-toggle-button').show().html("打开收藏夹" + '<span class="badge">' + data.user.favouritesCount + '条记录</span>');
                    Messenger().post({
                        id: 'successful-signed-up',
                        type: data.message[0],
                        message: data.message[1],
                        showCloseButton: true
                    });
                } else if (data.r == 1) {
                } else if (data.r == 2) {
                }
            },
            error: function () {
                Messenger().post({
                    id: 'error-out-of-time',
                    type: 'error',
                    message: '与服务器通信出现问题，请重试',
                    showCloseButton: true
                });
            }
        })
    });
    // AJAX请求 登出
    $('#signout-button').click(function () {
        $.ajax({
            url: '/api/v1/session',
            type: 'DELETE',
            dataType: 'json'
        }).done(function (data) {
            if (!data.r) {
                login_status = false;
                favourite_status = false;
                $('li.logged-in-navbar').hide();
                $('#favourites-toggle-button').hide();
                $('li.anonymous-navbar').show();
                $('#add-to-favourites-button').html('<i class="icon-bookmark-empty"></i>');
                // TODO 清空收藏夹内容 然后才能隐藏
                $('#favourites-container').hide();
                Messenger().post({
                    id: 'successful-logged-out',
                    message: '已成功注销',
                    type: 'success',
                    showCloseButton: true
                })
            }
        });
    });
    // 点击导航栏登入链接事件触发此函数，操作DOM使登录表单显示出来
    $('#signin-button').click(function () {
        $('#url-form-container').hide();
        $('#short-url-container').hide();
        $('#signup-form-container').hide();
        $('#signin-form-container').show();
    });
    // 点击导航栏注册链接事件触发此函数，操作DOM使注册表单显示出来
    $('#signup-button').click(function () {
        $('#url-form-container').hide();
        $('#short-url-container').hide();
        $('#signin-form-container').hide();
        $('#signup-form-container').show();
    });
    // 点击放弃按钮事件触发此函数，操作DOM使首页恢复初始化状态
    $('button.return-to-index').click(function () {
        $('#signup-form-container').hide();
        $('#signin-form-container').hide();
        $('#url-form-container').show();
    });
    // 点击收藏夹状态切换按钮事件触发此函数，Ajax通过API获取用户收藏夹，并操作DOM使收藏夹显示出来
    $('#favourites-toggle-button').click( function () {
            if ( favourites_open_status == false ) {
                $('#favourites-toggle-button').attr("disabled", "disabled").html('<i class="icon-refresh icon-spin"></i>' + " 正在打开收藏夹");
                $.ajax({
                    url: '/api/v1/user/favourites?page=' + current_page,
                    contentType: "application/json; charset=utf-8",
                    type: 'GET',
                    dataType: 'json',
                    timeout: 5000,
                    success: function (data) {
                        if (data.r == 0) {
                            $('#favourites-toggle-button').removeAttr("disabled").html("关闭收藏夹");
                            $('#favourites-container').show();
                            $('#favourites-panel-title').html(data.user.username + "的收藏夹");
                            favourites_open_status = true;
                            // TODO 展示收藏夹内容
                        }
                    },
                    error: function () {
                        Messenger().post({
                            id: 'error-out-of-time',
                            type: 'error',
                            message: '与服务器通信出现问题，请重试',
                            showCloseButton: true
                        });
                    }
                });
            } else if ( favourites_open_status == true ) {
                favourites_open_status = false;
                // TODO 清空收藏夹内容
                $('#favourites-container').hide();
                $('#favourites-toggle-button').html("打开收藏夹" + '<span class="badge">' + favourites_count + '条记录</span>');
            }
        }
    );
});