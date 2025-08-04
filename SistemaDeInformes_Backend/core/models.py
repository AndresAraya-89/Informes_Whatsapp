# core/models.py
from django.db import models

# =============================================
# Modelo para la tabla: Contacto
# =============================================
class Contacto(models.Model):
    # Django usa 'id' por defecto, pero podemos especificar el nuestro.
    # 'primary_key=True' le dice a Django que esta es la llave primaria.
    # 'db_column' mapea este campo a la columna exacta en SQL Server.
    id_contacto = models.AutoField(primary_key=True, db_column='IdContacto')
    nombre = models.CharField(max_length=100, db_column='Nombre')
    telefono = models.CharField(max_length=100, unique=True, db_column='Telefono')
    correo_electronico = models.CharField(max_length=100, unique=True, blank=True, null=True, db_column='CorreoElectronico')
    estado = models.IntegerField(db_column='Estado')
    fecha_creacion = models.DateTimeField(db_column='FechaCreacion')

    class Meta:
        managed = False  # ¡MUY IMPORTANTE! Le dice a Django que no gestione esta tabla (no la cree, modifique ni borre).
        db_table = 'Contacto' # El nombre exacto de nuestra tabla en SQL Server.

    def __str__(self):
        return self.nombre

# =============================================
# Modelo para la tabla: Archivo
# =============================================
class Archivo(models.Model):
    id_archivo = models.AutoField(primary_key=True, db_column='IdArchivo')
    nombre = models.CharField(max_length=100, unique=True, db_column='Nombre')
    url_publica = models.CharField(max_length=500, db_column='URLPublica')
    fecha_subida = models.DateTimeField(db_column='FechaSubida')

    class Meta:
        managed = False
        db_table = 'Archivo'

    def __str__(self):
        return self.nombre

# =============================================
# Modelo para la tabla: Envio
# =============================================
class Envio(models.Model):
    id_envio = models.AutoField(primary_key=True, db_column='IdEnvio')
    # Definimos la relación con la tabla Contacto.
    # 'on_delete=models.DO_NOTHING' significa que si se borra un contacto, no se haga nada con los envíos asociados.
    id_contacto = models.ForeignKey(Contacto, on_delete=models.DO_NOTHING, db_column='IdContacto')
    # Definimos la relación con la tabla Archivo.
    id_archivo = models.ForeignKey(Archivo, on_delete=models.DO_NOTHING, db_column='IdArchivo')
    fecha_envio = models.DateTimeField(db_column='FechaEnvio')
    estado_envio = models.CharField(max_length=20, db_column='EstadoEnvio')
    twilio_sid = models.CharField(max_length=100, blank=True, null=True, db_column='TwilioSID')

    class Meta:
        managed = False
        db_table = 'Envio'

    def __str__(self):
        return f"Envío {self.id_envio} a {self.id_contacto.nombre}"

