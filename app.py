# _*_ coding: utf-8 _*_

from flask import render_template, request, jsonify, session, redirect, url_for, flash
from config import app, db, Config
from models import PicAlbum
import qiniu


# 给jinja模板导入一个全局变量
@app.context_processor
def inject_bucket_name():
    # inject: 注射 context:上下文 processor:处理器
    return dict(bucket_name=Config.QINIU_BUCKET_PREFIX)


@app.route('/', methods=['GET', 'POST'])
def index():
    db.create_all()
    all_pics = PicAlbum.fetch_all_pics()
    return render_template("index.html", all_pics=all_pics)


# 独立的一个上传页面，并防止用户在没登录的情况下直接调用上传页面
@app.route('/upload', methods=['GET', 'POST'])
def upload():
    if session.get('logged_in') != True:
        flash(u'请先登录再使用上传功能')
        return redirect(url_for('signin'))
    else:
        return render_template("upload.html")


# 生成上传token
@app.route('/upload_token', methods=['GET'])
def upload_token():
    """
    客户端上传前需要先从服务端获取token,
    并将token作为上传请求的一部分，
    不带token的http请求将会返回401
    :return:
    """
    # 生成Auth对象
    q = qiniu.Auth(Config.QINIU_ACCESS_KEY, Config.QINIU_SECRET_KEY)
    # Auth调用upload_token()方法生成token
    token = q.upload_token(Config.PIC_BUCKET)
    return jsonify(uptoken=token)


# 上传回调：上传成功后返回json值，生成pic对象保存在服务器数据库里
@app.route('/upload_feedback', methods=['POST'])
def upload_feedback():
    pic_hash = request.json.get('hash')
    pic_key = request.json.get('key')
    pic = PicAlbum(pic_hash=pic_hash, pic_key=pic_key)
    db.session.add(pic)
    return jsonify(status="OK")


@app.route('/signin', methods=['GET', 'POST'])
def signin():
    if request.method == 'GET':
        return render_template('signin.html')
    if request.method == 'POST':
        if request.form['username'] != Config.USERNAME:
            flash(u'用户名或密码错误')
            return redirect(url_for('signin'))
        elif request.form['password'] != Config.PASSWORD:
            flash(u'用户名或密码错误')
            return redirect(url_for('signin'))
        else:
            session['logged_in'] = True
            flash(u'登入成功')
        return redirect(url_for('index'))


@app.route('/signout', methods=['GET'])
def signout():
    session.pop('logged_in', None)
    flash(u'登出成功')
    return redirect(url_for('index'))


if __name__ == "__main__":
    app.run(host='127.0.0.1', port=5000)
