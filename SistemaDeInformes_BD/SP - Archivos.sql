USE SistemasDeInformes
GO

-- =============================================
-- 1. PROCEDIMIENTO PARA CREAR UN NUEVO ARCHIVO
-- =============================================
CREATE OR ALTER PROCEDURE sp_CrearArchivo
AS
BEGIN
    DECLARE @NuevoId INT;
    DECLARE @NombreGenerado VARCHAR(100);
	DECLARE @URLPublica VARCHAR(500) = 'URL_TEMP'


    INSERT INTO Archivo (Nombre, URLPublica)
    VALUES ('TEMP', @URLPublica);
    SET @NuevoId = SCOPE_IDENTITY();

    SET @NombreGenerado = CAST(@NuevoId AS VARCHAR) + '_ReporteInsidente_SIRYM';

    UPDATE Archivo
    SET Nombre = @NombreGenerado
    WHERE IdArchivo = @NuevoId;
END
GO

-- =============================================
-- 2. PROCEDIMIENTO PARA OBTENER UN ARCHIVO POR SU ID
-- =============================================
CREATE OR ALTER PROCEDURE sp_ObtenerArchivoPorId
    @IdArchivo INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        IdArchivo,
        Nombre,
        URLPublica,
        FechaSubida
    FROM 
        Archivo
    WHERE 
        IdArchivo = @IdArchivo;
END
GO

PRINT 'Procedimiento sp_ObtenerArchivoPorId creado exitosamente.';
GO

-- =============================================
-- 3. PROCEDIMIENTO PARA OBTENER TODOS LOS ARCHIVOS
-- =============================================
CREATE OR ALTER PROCEDURE sp_ObtenerTodosLosArchivos
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        IdArchivo,
        Nombre,
        URLPublica,
        FechaSubida
    FROM 
        Archivo
    ORDER BY 
        FechaSubida DESC; -- Ordena para mostrar los más recientes primero
END
GO

PRINT 'Procedimiento sp_ObtenerTodosLosArchivos creado exitosamente.';
GO

-- =============================================
-- 4. PROCEDIMIENTO PARA BUSCAR ARCHIVOS POR NOMBRE
-- =============================================
CREATE OR ALTER PROCEDURE sp_BuscarArchivoPorNombre
    @Nombre VARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        IdArchivo,
        Nombre,
        URLPublica,
        FechaSubida
    FROM 
        Archivo
    WHERE 
        Nombre LIKE '%' + @Nombre + '%'
    ORDER BY 
        Nombre;
END
GO

PRINT 'Procedimiento sp_BuscarArchivoPorNombre creado exitosamente.';
GO