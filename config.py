# _*_ coding: utf-8 _*_
import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy


class Config:
    # flask密钥
    SECRET_KEY = os.environ.get('SECRET_KEY') or '$%^NB4%^#_+UHha'

    # SQLAlchemy设置
    basedir = os.path.abspath(os.path.dirname(__file__))
    SQLALCHEMY_COMMIT_ON_TEARDOWN = True
    SQLALCHEMY_TRACK_MODIFICATIONS = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///' + os.path.join(basedir, 'data.sqlite')

    # 用户信息
    USERNAME = "test"
    PASSWORD = "123456"

    # 七牛信息
    QINIU_ACCESS_KEY = '请登陆七牛后台获取'
    QINIU_SECRET_KEY = '请登陆七牛后台获取'
    QINIU_BUCKET_PREFIX = '请登陆七牛后台获取'
    PIC_BUCKET = '请登陆七牛后台获取'

    # dev
    DEBUG = True


app = Flask(__name__)
app.config.from_object(Config)
db = SQLAlchemy(app)
