USE [SistemasDeInformes]
GO

SELECT * FROM [dbo].[Contacto];
SELECT * FROM [dbo].[Archivo];
SELECT * FROM [dbo].[Envio];

EXEC [dbo].[sp_ObtenerArchivoPorId] @IdArchivo = 1;
EXEC [dbo].[sp_ObtenerTodosLosArchivos];
EXEC [dbo].[sp_BuscarArchivoPorNombre] @Nombre = 'Informe2';

EXEC [dbo].[sp_ObtenerContactoPorId] @Id = 1;

EXEC [dbo].[sp_BuscarIdAchivoConURL] @URL_archivo = 'https://drive.google.com/file/d/1Kz2v2OOI9XNH5hXQuiLAdDFBWOvDlEj3/view?usp=drivesdk';
EXEC sp_ObtenerContactosGerencialesTelefono;