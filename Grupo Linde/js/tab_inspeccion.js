ChartManager.renderInspeccion = function() {

          this.renderModuloKPI({
            campoTiempo: 'tiempoinspeccion', campoCumplimiento: 'cumpleinspeccion', campoJustificacion: 'justificacioninspeccion',
            elTT: 'valTTInspeccion', elDT: 'valDTInspeccion', chartLinea: 'chartPromInspeccion', chartDona: 'chartCumpleInspeccion',
            chartJust: null, tblJust: null, tblDetalle: 'tblDetalleInspeccionBody',
            columnasTabla: ['do_b', 'id_operacion', 'num_doc_trans', 'cumpleinspeccion', 'tiempoinspeccion', 'justificacioninspeccion'],
            tblFilterField: 'cumpleinspeccion', tblFilterValue: 'SI',
            campoFecha: 'fechadelevante', campoRazonMes: null, campoRazonJust: null, mod: 'inspeccion', requiredField: 'detalleinspeccion',
            dtFilterField: 'detalleinspeccion', keepDonaBlanks: true, dtRequiresFechaLevante: true
          });
        }