from rest_framework import permissions

class IsTeacherOrAdmin(permissions.BasePermission):
    """
    Custom permission to only allow teachers or admins to edit.
    """
    def hasattr_role(self, user):
        return hasattr(user, 'role')

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
            
        if request.method in permissions.SAFE_METHODS:
            return True
            
        if self.hasattr_role(request.user):
            return request.user.is_teacher() or request.user.is_admin()
        return False
