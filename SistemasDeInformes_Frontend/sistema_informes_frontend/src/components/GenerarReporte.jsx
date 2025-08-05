// En alguna otra página de tu aplicación, por ejemplo, ReportPreviewPage.jsx

import React from 'react';
import IncidentReportPDF from './components/IncidentReportPDF';

// Importa una imagen de ejemplo para el anexo
import anexoEjemplo from './assets/anexo-bus.jpg'; // <-- Reemplaza con una imagen real

function ReportPreviewPage() {

    // Estos son los datos que le pasarás al componente.
    // En tu aplicación real, estos datos vendrían de un formulario o de la API.
    const sampleReportData = {
        fecha: '04 de Agosto del 2024',
        lugar: 'TRACASA - LIMÓN',
        oficiales: 'Heiner Vargas',
        tipoIncidente: 'Daño en Unidad',
        afectado: 'TRACASA',
        narracion: 'Se reporta que la unidad 1996, presenta daños en la carrocería. El chofer Jonathan, al acomodar la unidad la golpeo contra otro bus estacionado.',
        anexoUrl: anexoEjemplo // Usamos la imagen importada
    };

    return (
        <div className="container mt-5">
            <h2>Previsualización del Informe de Incidente</h2>
            <p>Aquí puedes ver cómo se verá el informe. Haz clic en el botón para generar y descargar el PDF.</p>
            <hr />

            <IncidentReportPDF reportData={sampleReportData} />
        </div>
    );
}

export default ReportPreviewPage;