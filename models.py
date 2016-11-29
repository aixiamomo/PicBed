# _*_ coding: utf-8 _*_

from config import db


class PicAlbum(db.Model):
    __tablename__ = "picalbum"

    id = db.Column(db.Integer, primary_key=True)
    pic_hash = db.Column(db.String(64))
    pic_key = db.Column(db.String(64), index=True)
    pic_description = db.Column(db.String(64), index=True, default="No descriptions yet.")
    upload_time = db.Column(db.DateTime, index=True)

    @classmethod
    def fetch_all_pics(cls):
        return cls.query.all()

