USE SistemasDeInformes
GO

-- =============================================
-- 1. PROCEDIMIENTO PARA CREAR UN NUEVO ARCHIVO
-- =============================================
CREATE OR ALTER PROCEDURE sp_CrearArchivo
    @Nombre VARCHAR(100),
    @URLPublica VARCHAR(500)
AS
BEGIN
    -- Previene que se devuelvan los recuentos de filas afectadas
    SET NOCOUNT ON;

    -- Bloque de manejo de errores
    BEGIN TRY
        INSERT INTO Archivo (Nombre, URLPublica)
        VALUES (@Nombre, @URLPublica);
        
        -- Devuelve el ID del archivo recién creado
        SELECT SCOPE_IDENTITY() AS IdArchivoCreado;
    END TRY
    BEGIN CATCH
        -- Devuelve información del error si la inserción falla (ej. por nombre duplicado)
        SELECT 
            ERROR_NUMBER() AS ErrorNumber,
            ERROR_MESSAGE() AS ErrorMessage;
    END CATCH
END
GO

PRINT 'Procedimiento sp_CrearArchivo creado exitosamente.';
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