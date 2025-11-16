from rest_framework import permissions

class IsAdminOrSelf(permissions.BasePermission):
    """
    Permiso personalizado para permitir que un usuario se edite a sí mismo
    o que un administrador (is_staff) edite a cualquier usuario.
    """
    def has_object_permission(self, request, view, obj):
        # Si el usuario es un administrador (staff), tiene permiso
        if request.user and request.user.is_staff:
            return True
        
        # Si el usuario está intentando ver/editar su *propio* perfil, tiene permiso
        return obj == request.user

class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Permiso para permitir que los administradores editen,
    pero que los usuarios normales solo puedan leer.
    """
    def has_permission(self, request, view):
        # Permite 'GET', 'HEAD', 'OPTIONS' (lectura) a cualquier usuario autenticado
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Solo permite 'POST', 'PUT', 'PATCH', 'DELETE' (escritura) si es admin
        return request.user and request.user.is_staff