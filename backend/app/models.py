from . import db
import datetime
import enum

activity_tags = db.Table(
    'activity_tags',
    db.Column('activity_id', db.Integer, db.ForeignKey('activity.id'), primary_key=True),
    db.Column('tag_id', db.Integer, db.ForeignKey('tag.id'), primary_key=True)
)

class ActivityUnitType(enum.Enum):
    COUNT = "count"
    MINUTES = "minutes"

class ActivityGroup(db.Model):
    """
    アクティビティのグループを管理するモデル。
    
    Attributes:
        id (int): 自動採番される主キー。
        name (str): グループ名。
        client_id (str): Discord連携に使うClient ID。
        icon_name (str): アイコン名。
        icon_color (str): アイコンの色。
        position (int): UI側での表示順序。
    """
    __tablename__ = 'activity_group'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False, unique=True)
    client_id = db.Column(db.String(50))
    icon_name = db.Column(db.String(50), nullable=True)
    icon_color = db.Column(db.String(50), nullable=True)
    position = db.Column(db.Integer, nullable=False, default=0, server_default='0')
    
    def __repr__(self):
        return f"<ActivityGroup name={self.name} client_id={self.client_id}>"

class Activity(db.Model):
    """
    アクティビティの項目を記録するモデル。

    Attributes:
        id (int): 自動採番される主キー。
        is_active (bool): 項目が有効(選択可能)であるかどうかを表す真偽値。デフォルトはTrue。
        name (str): アクティビティの名称（例: "勉強", "運動"）。
        unit (enum): アクティビティの記録単位(回数または経過時間)。
        asset_key (str): Discord Developer Portalで設定した画像に対応するアセットキー。
        created_at (datetime): アクティビティ作成日時。デフォルトは現在時刻。
        group_id: アクティビティが所属するグループのID。
    """
    id = db.Column(db.Integer, primary_key=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    name = db.Column(db.String(80), nullable=False)
    unit = db.Column(db.Enum(ActivityUnitType), nullable=True)
    asset_key = db.Column(db.String(80))
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    records = db.relationship('Record', back_populates='activity', lazy=True)
    group_id = db.Column(db.Integer, db.ForeignKey('activity_group.id'), nullable=False)
    group = db.relationship('ActivityGroup', backref='activities')
    tags = db.relationship(
        "Tag",
        secondary=activity_tags,
        back_populates="activities"
    )

    def __repr__(self):
        unit_value = self.unit.value if self.unit is not None else None
        return f"<Activity id={self.id} name={self.name} unit={unit_value}>"

class Tag(db.Model):
    """
    タグを記録するモデル。
    
    Attributes:
        id (int): 自動採番される主キー。
        name (str): タグの名称。
        color (str): UI表示などに用いるタグの色。
    """
    __tablename__ = 'tag'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False, unique=True)
    color = db.Column(db.String(50), nullable=True)
    
    activities = db.relationship(
        "Activity",
        secondary=activity_tags,
        back_populates="tags"
    )

    def __repr__(self):
        return f"<Tag id={self.id} name={self.name}>"
    

class Record(db.Model):
    """
    アクティビティのレコードを記録するモデル。

    Attributes:
        id (int): 自動採番される主キー。
        activity_id (int): 記録の対象のアクティビティのid(外部キー)。
        value (float): アクティビティの時間または回数を表す実数。
        created_at (datetime): アクティビティ作成日時または開始時刻。デフォルトは現在日時。
    """
    id = db.Column(db.Integer, primary_key=True)
    activity_id = db.Column(db.Integer, db.ForeignKey('activity.id'), nullable=False)
    activity = db.relationship('Activity', back_populates='records')
    value = db.Column(db.Float)
    memo = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<Record id={self.id}>"

