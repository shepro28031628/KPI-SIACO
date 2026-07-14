ChartManager.renderAgilidad = function() {

          this.renderModuloKPI({
            campoTiempo: 'tiempoagilidad', campoCumplimiento: 'cumpleagilidad', campoJustificacion: 'responsableagilidad',
            campoCausal: 'justificacionagilidad',
            campoFecha: 'fechadelevante',
            elTT: 'valTTAgilidad', elDT: 'valDTAgilidad', chartLinea: 'chartPromAgilidad', chartDona: 'chartCumpleAgilidad',
            chartJust: 'chartJustAgilidad', tblJust: 'tblJustAgilidadBody', tblDetalle: 'tblDetalleAgilidadBody',
            columnasTabla: ['do', 'do3m', 'documentodetransporte', 'cumpleagilidad', 'responsableagilidad', 'justificacionagilidad'],
            campoRazonMes: 'mes', campoRazonJust: 'justificacionesoperaciones', mod: 'agilidad'
          });
        }




