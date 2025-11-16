# core/serializers.py

from rest_framework import serializers
from .models import Usuario
import re
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.hashers import make_password
from django.db import connection

# --- 1. IMPORTACIÓN QUE GENERA EL WARNING (HASTA QUE SE USA) ---
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


# --- 2. NUEVO SERIALIZADOR DE TOKEN (AQUÍ SE USA LA IMPORTACIÓN) ---
# Al añadir esta clase, el warning de la línea 12 desaparecerá.
class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Personaliza el token JWT para incluir el nombre del usuario
    y el estado de recuperación de contraseña.
    """
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Añadir datos personalizados al token
        token['username'] = user.username
        token['first_name'] = user.first_name
        token['last_name'] = user.last_name
        token['is_staff'] = user.is_staff
        # --- ¡ESTA ES LA LÍNEA CLAVE! ---
        # Le dice al frontend si el usuario está en modo de recuperación.
        token['estadoRecuperacion'] = user.estadoRecuperacion

        return token


# --- TU CÓDIGO EXISTENTE (No necesita cambios) ---
class UserSerializer(serializers.ModelSerializer):
    """
    Serializador para el modelo de Usuario.
    Maneja la lógica de creación y actualización de usuarios,
    incluyendo el hash seguro de las contraseñas.
    """
    
    password = serializers.CharField(write_only=True, required=False, style={'input_type': 'password'})

    class Meta:
        model = Usuario
        fields = (
            'id', 
            'username', 
            'password', 
            'first_name', 
            'last_name', 
            'email', 
            'telefono', 
            'estadoActividad', 
            'estadoRecuperacion',
            'is_staff'
        )
        read_only_fields = ('estadoActividad', 'estadoRecuperacion', 'is_staff')

    def validate_telefono(self, value):
        """
        Valida que el teléfono tenga 8 dígitos numéricos.
        """
        if value and not re.match(r'^\d{8}$', value):
            raise serializers.ValidationError("El teléfono debe contener exactamente 8 dígitos numéricos.")
        return value

    def create(self, validated_data):
        """
        Sobrescribe el método 'create' para añadir "506" al teléfono
        y usar el helper de Django que encripta la contraseña.
        """
        telefono = validated_data.get('telefono')
        if telefono:
            validated_data['telefono'] = f"506{telefono}"

        user = Usuario.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            telefono=validated_data.get('telefono', '')
        )
        return user

    def update(self, instance, validated_data):
        """
        Sobrescribe el método 'update' para añadir "506" al teléfono
        y manejar la actualización de la contraseña de forma segura.
        """
        telefono = validated_data.get('telefono')
        if telefono:
            validated_data['telefono'] = f"506{telefono}"

        instance = super().update(instance, validated_data)

        password = validated_data.get('password')
        if password:
            instance.set_password(password)
            instance.save()
            
        return instance

    def to_representation(self, instance):
        """
        Modifica cómo se "muestra" el usuario en la API.
        Quita el prefijo "506" del teléfono antes de enviarlo al frontend.
        """
        representation = super().to_representation(instance)
        telefono = representation.get('telefono')
        
        if telefono and telefono.startswith('506') and len(telefono) == 11:
            representation['telefono'] = telefono[3:]
            
        return representation

class UserStatusSerializer(serializers.ModelSerializer):
    """
    Un serializador más simple, usado por usuarios normales
    para actualizar el estado de otros usuarios.
    """
    class Meta:
        model = Usuario
        fields = ('estadoActividad',)


# --- 3. NUEVO SERIALIZADOR PARA CAMBIAR CONTRASEÑA ---
# Este lo usará el usuario cuando sea forzado a cambiar su contraseña.
class ChangePasswordSerializer(serializers.Serializer):
    """
    Serializador para que un usuario (logueado) cambie su propia contraseña.
    """
    old_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(required=True, write_only=True)

    def validate_new_password(self, value):
        # Aplica los validadores de contraseña de Django (ej. mínimo 8 caracteres, etc.)
        validate_password(value, self.context['request'].user)
        return value

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("La contraseña antigua (temporal) es incorrecta.")
        return value

    def save(self, **kwargs):
        user = self.context['request'].user
        new_password = self.validated_data['new_password']
        
        # Encriptamos la contraseña
        password_encriptado = make_password(new_password)
        
        # Llama al SP para actualizar la contraseña y desactivar el flag de recuperación
        with connection.cursor() as cursor:
            cursor.execute("EXEC sp_ActualizarPasswordDefinitivo @UsuarioID=%s, @NuevoPasswordEncriptado=%s",
                           [user.id, password_encriptado])
        
        # Marcamos el flag en el objeto de usuario actual también
        user.estadoRecuperacion = False
        return user