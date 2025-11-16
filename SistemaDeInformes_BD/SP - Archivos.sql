USE SistemasDeInformes
GO

-- =============================================
-- 1. PROCEDIMIENTO PARA CREAR UN NUEVO ARCHIVO
-- =============================================
CREATE OR ALTER PROCEDURE sp_CrearArchivo
    @URLPublica VARCHAR(500)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @NuevoId INT;
    DECLARE @NombreGenerado VARCHAR(100);

    -- Insertar con valores temporales
    INSERT INTO Archivo (Nombre, URLPublica)
    VALUES ('TEMP', @URLPublica);
    
    -- Obtener el ID recién creado
    SET @NuevoId = SCOPE_IDENTITY();

    -- Generar el nombre final
    SET @NombreGenerado = CAST(@NuevoId AS VARCHAR) + '_ReporteInsidente_SIRYM';

    UPDATE Archivo
    SET Nombre = @NombreGenerado
    WHERE IdArchivo = @NuevoId;

    -- Devolver el ID y el nombre generado en una sola consulta
    SELECT IdArchivo = @NuevoId, Nombre = @NombreGenerado;
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

-- =============================================
-- 4. SP para consultar el id del archivo por medio de la url
-- =============================================
CREATE OR ALTER PROCEDURE sp_BuscarIdAchivoConURL
    @URL_archivo VARCHAR(500)
AS
BEGIN
    SELECT TOP 1 IdArchivo
	FROM Archivo
	WHERE [URLPublica] = @URL_archivo 
END
GO


CREATE OR ALTER PROCEDURE sp_ObtenerArchivoPorURL
    @urlPublica VARCHAR (500)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 1
        IdArchivo,
        Nombre,
        URLPublica,
        FechaSubida
    FROM 
        Archivo
    WHERE 
        URLPublica = @urlPublica;
END
GO