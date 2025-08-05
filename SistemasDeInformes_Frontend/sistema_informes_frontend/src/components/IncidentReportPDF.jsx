import React, { useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Asume que tienes tu logo en la carpeta de assets
import logoSirym from '../assets/sirym-logo.png'; // <-- IMPORTANTE: Reemplaza con la ruta a tu logo

function IncidentReportPDF({ reportData }) {
  const reportTemplateRef = useRef(null);

  const generatePDF = () => {
    const input = reportTemplateRef.current;
    if (!input) return;

    // Usamos html2canvas para capturar el div como una imagen
    html2canvas(input, { scale: 2 }) // Aumentamos la escala para mejor resolución
      .then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        
        // Creamos una instancia de jsPDF en formato A4 (210mm x 297mm)
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        
        // Calculamos la relación de aspecto para que la imagen ocupe todo el ancho
        const ratio = canvasWidth / canvasHeight;
        const imgHeight = pdfWidth / ratio;
        
        // Añadimos la imagen al PDF
        // Si el alto de la imagen es mayor que el de la página, necesitaríamos lógica para múltiples páginas
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeight);
        
        // Guardamos el PDF
        pdf.save(`Informe_Incidente_${reportData.fecha.replace(/\s/g, '_')}.pdf`);
      });
  };

  return (
    <div>
      {/* Botón para generar el PDF */}
      <button onClick={generatePDF} className="btn btn-primary mb-4">
        <i className="fas fa-file-pdf me-2"></i>
        Generar Informe en PDF
      </button>

      {/* --- INICIO DEL TEMPLATE PARA EL PDF --- */}
      {/* Este es el div que "fotografiaremos". Lo diseñamos para que parezca un documento A4. */}
      {/* Le damos un ancho fijo para controlar cómo se verá. */}
      <div 
        ref={reportTemplateRef} 
        style={{ 
          width: '210mm', 
          minHeight: '297mm', 
          padding: '10mm', 
          backgroundColor: 'white',
          fontFamily: 'Arial, sans-serif',
          fontSize: '12px',
          color: 'black'
        }}
      >
        {/* Encabezado */}
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid black' }}>
          <tbody>
            <tr>
              <td style={{ width: '30%', border: '1px solid black', padding: '10px', textAlign: 'center' }}>
                <img src={logoSirym} alt="Logo SIRYM" style={{ maxWidth: '100px' }} />
              </td>
              <td style={{ width: '70%', border: '1px solid black', padding: '10px' }}>
                <h1 style={{ textAlign: 'center', textDecoration: 'underline', margin: 0 }}>Informe de Incidente</h1>
                <div style={{ borderTop: '1px solid black', marginTop: '10px', paddingTop: '10px' }}>
                  <strong>Aprobado por:</strong> Gerencia General
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Cuerpo del Informe */}
        <div style={{ marginTop: '20px' }}>
          <p><strong>Fecha:</strong> {reportData.fecha}</p>
          <p><strong>Lugar del evento:</strong> {reportData.lugar}</p>
          <p><strong>Oficiales en servicio:</strong> {reportData.oficiales}</p>
          <p><strong>Tipo de incidente:</strong> {reportData.tipoIncidente}</p>
          <p><strong>Datos del o los afectado:</strong> {reportData.afectado}</p>
        </div>

        {/* Narración */}
        <div style={{ marginTop: '20px' }}>
          <p><strong>Narración de Hecho:</strong></p>
          <p>{reportData.narracion}</p>
        </div>

        {/* Anexo */}
        <div style={{ marginTop: '20px' }}>
          <p><strong>Anexo.</strong></p>
          {reportData.anexoUrl && (
            <img src={reportData.anexoUrl} alt="Anexo del incidente" style={{ maxWidth: '100%', border: '1px solid #ccc' }} />
          )}
        </div>
        
        {/* Footer (posicionado al final si usamos flexbox en el contenedor principal) */}
        {/* Para un PDF de una página, un posicionamiento simple funciona bien */}
        <div style={{ marginTop: '40px', paddingTop: '10px', borderTop: '1px solid black', textAlign: 'center', fontSize: '10px' }}>
          <p>Teléfono: 8831-4676. Email: sirymcr@gmail.com</p>
          <p>Dirección: Limón, Urbanización Los Cocos.</p>
        </div>
      </div>
      {/* --- FIN DEL TEMPLATE PARA EL PDF --- */}
    </div>
  );
}

export default IncidentReportPDF;