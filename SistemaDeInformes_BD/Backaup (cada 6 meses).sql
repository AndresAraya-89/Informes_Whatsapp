/**********************************************************************
 * SCRIPT PARA CREAR UN JOB DE BACKUP SEMESTRAL
 * BASE DE DATOS: SistemasDeInformes
 * EJECUCI�N: El d�a 1, cada 6 meses, a las 3:00 AM
 **********************************************************************/
USE [msdb];
GO

DECLARE @jobId BINARY(16);
DECLARE @jobName NVARCHAR(128) = N'Backup Semestral - SistemasDeInformes';

-- === 1. CREAR EL JOB ===
EXEC msdb.dbo.sp_add_job
    @job_name = @jobName,
    @enabled = 1,
    @description = N'Realiza un backup completo de la base de datos SistemasDeInformes cada 6 meses.',
    @category_name = N'[Uncategorized (Local)]',
    @owner_login_name = N'sa',
    @job_id = @jobId OUTPUT;

-- === 2. LA TAREA DE BACKUP ===
EXEC msdb.dbo.sp_add_jobstep
    @job_name = @jobName,
    @step_name = N'Ejecutar Backup Completo',
    @step_id = 1,
    @cmdexec_success_code = 0,
    @on_success_action = 1, -- 1 = Salir con exito
    @on_fail_action = 2,    -- 2 = Salir con fallo
    @subsystem = N'TSQL',
    @command = N'
-- =================================================================
--  ��� IMPORTANTE !!!
--  �LA RUTA FUE CORREGIDA PERO NO ES RECOMENDADA!
--  Aseg�rate que la cuenta del Agente SQL tiene permisos aqu�.
-- =================================================================

-- ERROR 2 CORREGIDO: Se quit� el "C:\" duplicado
BACKUP DATABASE [SistemasDeInformes]
TO DISK = N''C:\Users\User\Desktop\SistemasDeInformes.bak''
WITH
    NAME = N''SistemasDeInformes - Backup Completo'',
    INIT,  -- SOBREESCRIBE el archivo de backup anterior.
    STATS = 10;
',
    @database_name = N'master',
    @flags = 0;

-- === 3. CREAR EL HORARIO (SCHEDULE) ===
EXEC msdb.dbo.sp_add_schedule
    @schedule_name = N'Semestral (D�a 1, cada 6 meses)',
    @enabled = 1,
    @freq_type = 16,             -- 16 = Mensualmente
    @freq_interval = 1,          -- El d�a 1 del mes
    @freq_subday_type = 1,       -- 1 = A la hora especificada
    @freq_recurrence_factor = 6, -- <<< CADA 6 MESES
    @active_start_date = 20250101,
    @active_end_date = 99991231,
    @active_start_time = 30000,  -- 03:00:00 AM
    @active_end_time = 235959;

-- === 4. ASOCIAR EL HORARIO AL JOB ===
EXEC msdb.dbo.sp_attach_schedule
    @job_name = @jobName,
    @schedule_name = N'Semestral (D�a 1, cada 6 meses)';

-- (Opcional) Asignar el job al servidor actual
EXEC msdb.dbo.sp_add_jobserver
    @job_name = @jobName,
    @server_name = N'(local)';
GO

PRINT N'Job "Backup Semestral - SistemasDeInformes" creado exitosamente.';
GO