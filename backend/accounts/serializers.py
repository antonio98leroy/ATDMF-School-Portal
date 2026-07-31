from rest_framework import serializers
from .models import User
class UserSerializer(serializers.ModelSerializer):
    role_display=serializers.CharField(source='get_role_display',read_only=True)
    full_name=serializers.SerializerMethodField()
    class Meta:
        model=User; fields=['id','username','first_name','last_name','full_name','email','phone_number','role','role_display','profile_photo','is_first_login','is_active']
    def get_full_name(self,obj): return obj.get_full_name() or obj.username
class UserCreateSerializer(serializers.ModelSerializer):
    password=serializers.CharField(write_only=True,min_length=8)
    class Meta: model=User; fields=['id','username','password','first_name','last_name','email','phone_number','role']
    def create(self,validated_data): return User.objects.create_user(**validated_data)
