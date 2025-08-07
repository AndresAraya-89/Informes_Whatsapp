USE [SistemasDeInformes]
GO

SELECT * FROM [dbo].[Contacto];
SELECT * FROM [dbo].[Archivo];
SELECT * FROM [dbo].[Envio];

EXEC [dbo].[sp_ObtenerArchivoPorId] @IdArchivo = 1;
EXEC [dbo].[sp_ObtenerTodosLosArchivos];
EXEC [dbo].[sp_BuscarArchivoPorNombre] @Nombre = 'Informe2';
EXEC [dbo].[sp_CrearArchivo];


