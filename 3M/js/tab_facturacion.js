ChartManager.renderFacturacion = function() {

          this.renderModuloKPI({
            campoTiempo: 'tiempofacturacion', campoCumplimiento: 'cumplefacturacion', campoJustificacion: 'responsablefacturacion',
            campoCausal: 'justificacionfacturacion',
            campoFecha: 'fechadelevante',
            elTT: 'valTTFactura', elDT: 'valDTFactura', chartLinea: 'chartPromFactura', chartDona: 'chartCumpleFactura',
            chartJust: 'chartJustFactura', tblJust: 'tblJustFacturaBody', tblDetalle: 'tblDetalleFacturaBody',
            columnasTabla: ['do', 'do3m', 'documentodetransporte', 'cumplefacturacion', 'responsablefacturacion', 'justificacionfacturacion'],
            campoRazonMes: 'mes1', campoRazonJust: 'justificacionesfacturacion', mod: 'facturacion'
          });
        }




