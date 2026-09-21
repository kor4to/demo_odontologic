import { useState, useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route, Link, useParams } from 'react-router-dom'
import SignatureCanvas from 'react-signature-canvas'

// --- PANTALLA 1: PANEL DE CONTROL PRINCIPAL ---
function PanelPrincipal() {
  const [vista, setVista] = useState('menu')
  const [pacientes, setPacientes] = useState([])
  const [agenda, setAgenda] = useState([])
  const [busqueda, setBusqueda] = useState('')

  // Función para obtener la fecha de hoy en formato local (YYYY-MM-DD)
  const obtenerFechaLocal = () => {
    const hoy = new Date();
    return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
  }

  // NUEVO: Estado para controlar qué día estamos viendo en el calendario (por defecto hoy)
  const [fechaAgenda, setFechaAgenda] = useState(obtenerFechaLocal())

  const [formData, setFormData] = useState({
    dni: '', nombres: '', apellidos: '', fecha_nacimiento: '', sexo: 'F'
  })

  const cargarPacientes = () => {
    fetch('https://api-clinica-backend-ffw2.onrender.com/pacientes').then(res => res.json()).then(data => setPacientes(data))
  }
  const cargarAgenda = () => {
    fetch('https://api-clinica-backend-ffw2.onrender.com/agenda').then(res => res.json()).then(data => setAgenda(data))
  }

  useEffect(() => { cargarPacientes(); cargarAgenda(); }, [])

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })

  const handleSubmit = (e) => {
    e.preventDefault()
    fetch('https://api-clinica-backend-ffw2.onrender.com/pacientes', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData)
    }).then(() => {
      cargarPacientes()
      setFormData({ dni: '', nombres: '', apellidos: '', fecha_nacimiento: '', sexo: 'F' })
      alert("Paciente registrado con éxito")
      setVista('buscar')
    })
  }

  const pacientesFiltrados = pacientes.filter(p =>
    p.nombres.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.apellidos.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.dni.includes(busqueda)
  )

  // NUEVA LÓGICA: Filtrar la agenda por día seleccionado y descartar citas pasadas por > 10 min
  const ahora = new Date();
  const fechaHoyStr = obtenerFechaLocal();

  const agendaDelDia = agenda.filter(cita => {
    // 1. Filtrar por la fecha que el usuario seleccionó en el calendario
    if (cita.fecha !== fechaAgenda) return false;

    // 2. Si estamos viendo el día de HOY, ocultar las que ya pasaron por más de 10 minutos
    if (fechaAgenda === fechaHoyStr && cita.hora) {
      const [horas, minutos] = cita.hora.split(':').map(Number);
      const horaCitaObj = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), horas, minutos);

      // Calculamos la diferencia en minutos (positivo significa que la hora ya pasó)
      const diferenciaMinutos = (ahora - horaCitaObj) / (1000 * 60);

      if (diferenciaMinutos > 10) {
        return false; // La cita ya pasó hace más de 10 mins, la ocultamos de la recepción
      }
    }
    return true; // Si cumple todo, la mostramos
  });

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">Panel de Control Clínica</h1>
            <p className="text-slate-500 mt-1 text-sm md:text-base">Seleccione una acción para comenzar</p>
          </div>
          {vista !== 'menu' && (
            <button onClick={() => setVista('menu')} className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors shadow-sm w-full sm:w-auto text-center">
              🏠 Volver al Inicio
            </button>
          )}
        </div>

        {vista === 'menu' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            <button onClick={() => setVista('buscar')} className="bg-white p-6 md:p-8 rounded-2xl shadow-sm hover:shadow-md border border-gray-200 flex flex-col items-center justify-center gap-4 transition-all hover:-translate-y-1 group">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">🔍</div>
              <h2 className="text-lg md:text-xl font-bold text-gray-800">Buscador / Historias</h2>
              <p className="text-xs md:text-sm text-gray-500 text-center">Buscar paciente o ver historia clínica.</p>
            </button>
            <button onClick={() => setVista('nuevo')} className="bg-white p-6 md:p-8 rounded-2xl shadow-sm hover:shadow-md border border-gray-200 flex flex-col items-center justify-center gap-4 transition-all hover:-translate-y-1 group">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">👤</div>
              <h2 className="text-lg md:text-xl font-bold text-gray-800">Nuevo Paciente</h2>
              <p className="text-xs md:text-sm text-gray-500 text-center">Añadir un paciente a la base de datos.</p>
            </button>
            <button onClick={() => { setVista('calendario'); cargarAgenda(); }} className="bg-white p-6 md:p-8 rounded-2xl shadow-sm hover:shadow-md border border-gray-200 flex flex-col items-center justify-center gap-4 transition-all hover:-translate-y-1 group sm:col-span-2 md:col-span-1">
              <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">📅</div>
              <h2 className="text-lg md:text-xl font-bold text-gray-800">Calendario de Citas</h2>
              <p className="text-xs md:text-sm text-gray-500 text-center">Ver las consultas programadas.</p>
            </button>
          </div>
        )}

        {vista === 'buscar' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 md:p-6 bg-blue-50/50 border-b border-gray-100">
              <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-3 md:mb-4">Buscar Paciente</h2>
              <input type="text" placeholder="Escriba el nombre, apellido o DNI..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="w-full border border-gray-300 rounded-xl p-3 md:p-4 focus:ring-2 focus:ring-blue-500 outline-none text-base md:text-lg shadow-inner" autoFocus />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[500px]">
                <thead><tr className="bg-gray-50 text-gray-500 text-xs md:text-sm uppercase tracking-wider"><th className="p-3 md:p-4">DNI</th><th className="p-3 md:p-4">Paciente</th><th className="p-3 md:p-4 text-right">Acción</th></tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {pacientesFiltrados.length === 0 ? (
                    <tr><td colSpan="3" className="p-8 text-center text-gray-500">No se encontraron pacientes.</td></tr>
                  ) : (
                    pacientesFiltrados.map(paciente => (
                      <tr key={paciente.id_paciente} className="hover:bg-blue-50/50">
                        <td className="p-3 md:p-4 text-sm md:text-base text-gray-600 font-medium">{paciente.dni}</td>
                        <td className="p-3 md:p-4 text-sm md:text-base text-gray-800 font-bold">{paciente.nombres} {paciente.apellidos}</td>
                        <td className="p-3 md:p-4 text-right">
                          <Link to={`/ficha/${paciente.id_paciente}`} className="inline-flex items-center text-xs md:text-sm font-bold text-white bg-blue-600 px-3 md:px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm whitespace-nowrap">
                            Abrir Ficha &rarr;
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {vista === 'nuevo' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 md:p-8 max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-6 border-b pb-4">
              <span className="text-2xl md:text-3xl">👤</span><h2 className="text-lg md:text-xl font-bold text-gray-800">Registrar Nuevo Paciente</h2>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
              <input className="border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-emerald-500 outline-none w-full" type="text" name="dni" placeholder="DNI" value={formData.dni} onChange={handleChange} required />
              <select className="border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-emerald-500 outline-none bg-white w-full" name="sexo" value={formData.sexo} onChange={handleChange}><option value="F">Femenino</option><option value="M">Masculino</option></select>
              <input className="border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-emerald-500 outline-none w-full" type="text" name="nombres" placeholder="Nombres" value={formData.nombres} onChange={handleChange} required />
              <input className="border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-emerald-500 outline-none w-full" type="text" name="apellidos" placeholder="Apellidos" value={formData.apellidos} onChange={handleChange} required />
              <input className="border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-emerald-500 outline-none text-gray-600 md:col-span-2 w-full" type="date" name="fecha_nacimiento" value={formData.fecha_nacimiento} onChange={handleChange} required />
              <button className="md:col-span-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg p-3 mt-2 shadow-sm w-full" type="submit">Guardar Paciente</button>
            </form>
          </div>
        )}

        {/* CALENDARIO ACTUALIZADO CON SELECTOR DE FECHA */}
        {vista === 'calendario' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 md:p-6 bg-purple-50/50 border-b border-gray-100 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📅</span>
                <h2 className="text-lg md:text-xl font-bold text-gray-800">Citas Programadas</h2>
              </div>

              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-purple-200 shadow-sm">
                <label className="text-xs md:text-sm font-bold text-gray-600">Ver día:</label>
                <input
                  type="date"
                  value={fechaAgenda}
                  onChange={(e) => setFechaAgenda(e.target.value)}
                  className="outline-none text-xs md:text-sm font-medium text-purple-700 bg-transparent cursor-pointer"
                />
              </div>
            </div>

            <div className="p-4 md:p-6 bg-gray-50/30">
              {agendaDelDia.length === 0 ? (
                <div className="text-center py-8">
                  <span className="text-4xl">📭</span>
                  <p className="text-gray-500 mt-3 font-medium">No hay citas pendientes para mostrar en esta fecha.</p>
                  {fechaAgenda === fechaHoyStr && <p className="text-xs text-gray-400 mt-1">(Las citas que ya pasaron por más de 10 min se ocultan automáticamente)</p>}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {agendaDelDia.map((cita) => (
                    <div key={cita.id_consulta} className="border border-purple-200 bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                      {/* Borde superior de color */}
                      <div className="absolute top-0 left-0 w-full h-1 bg-purple-500"></div>

                      <div className="flex justify-between items-start mb-3 mt-1">
                        <span className="text-gray-500 text-xs md:text-sm font-bold bg-gray-100 px-2 py-1 rounded">🕒 {cita.hora}</span>
                        {fechaAgenda === fechaHoyStr && <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-1 rounded animate-pulse">Pendiente</span>}
                      </div>
                      <h3 className="font-bold text-gray-800 text-base md:text-lg">{cita.paciente}</h3>
                      <p className="text-gray-600 text-xs md:text-sm mt-1 border-t border-gray-100 pt-2"><span className="font-bold text-gray-500">Motivo:</span> {cita.motivo}</p>

                      <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
                        <Link to={`/ficha/${cita.id_paciente}`} className="text-xs font-bold text-white bg-purple-600 px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors w-full text-center">
                          Iniciar Atención →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
// --- PANTALLA 2: FICHA CLÍNICA (RESPONSIVE) ---
function FichaClinica() {
  const { id_paciente } = useParams()
  const [paciente, setPaciente] = useState(null)
  const [consultas, setConsultas] = useState([])
  const [radiografias, setRadiografias] = useState([])
  const [odontogramas, setOdontogramas] = useState([])
  const [consentimientos, setConsentimientos] = useState([])

  const canvasRef = useRef(null)
  const firmaRef = useRef(null)
  const [consultaOdontograma, setConsultaOdontograma] = useState(null)
  const [visorOdontograma, setVisorOdontograma] = useState(null)
  const [modalSubirFoto, setModalSubirFoto] = useState(null)
  const [consultaAEditar, setConsultaAEditar] = useState(null)

  const [mostrarModalFirma, setMostrarModalFirma] = useState(false)
  const [visorConsentimiento, setVisorConsentimiento] = useState(null)
  const [procedimientoConsentimiento, setProcedimientoConsentimiento] = useState('Tratamiento Odontológico General')
  const [textoConsentimiento, setTextoConsentimiento] = useState('')

  const [fotoFile, setFotoFile] = useState(null)
  const [fotoDescripcion, setFotoDescripcion] = useState('')

  const [formAgenda, setFormAgenda] = useState({
    id_paciente: parseInt(id_paciente), fecha: new Date().toISOString().split('T')[0], hora: '10:00', motivo: '',
    antecedentes: '', examen_clinico: '', diagnostico: 'Por evaluar', plan_tratamiento: 'Por definir', evolucion: '', proximo_control: ''
  })

  const cargarDatos = () => {
    fetch(`https://api-clinica-backend-ffw2.onrender.com/pacientes/${id_paciente}`).then(res => res.json()).then(data => setPaciente(data))
    fetch(`https://api-clinica-backend-ffw2.onrender.com/pacientes/${id_paciente}/consultas`).then(res => res.json()).then(data => setConsultas(data))
    fetch(`https://api-clinica-backend-ffw2.onrender.com/pacientes/${id_paciente}/radiografias`).then(res => res.json()).then(data => setRadiografias(data))
    fetch(`https://api-clinica-backend-ffw2.onrender.com/pacientes/${id_paciente}/odontogramas`).then(res => res.json()).then(data => setOdontogramas(data))
    fetch(`https://api-clinica-backend-ffw2.onrender.com/pacientes/${id_paciente}/consentimientos`).then(res => res.json()).then(data => setConsentimientos(data))
  }

  useEffect(() => { cargarDatos() }, [id_paciente])

  const handleChangeAgenda = (e) => setFormAgenda({...formAgenda, [e.target.name]: e.target.value})
  const handleChangeEdicion = (e) => setConsultaAEditar({...consultaAEditar, [e.target.name]: e.target.value})

  const agendarCita = (e) => {
    e.preventDefault()
    fetch('https://api-clinica-backend-ffw2.onrender.com/consultas', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(formAgenda) }).then(() => { cargarDatos(); setFormAgenda({...formAgenda, motivo: ''}); alert("Cita agendada."); })
  }

  const guardarHistoriaClinica = (e) => {
    e.preventDefault()
    fetch(`https://api-clinica-backend-ffw2.onrender.com/consultas/${consultaAEditar.id_consulta}`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(consultaAEditar) }).then(() => { cargarDatos(); setConsultaAEditar(null); alert("Historia clínica guardada."); })
  }

  const guardarOdontograma = () => {
    if (canvasRef.current.isEmpty()) { alert("El odontograma está en blanco."); return; }
    const dataURL = canvasRef.current.getCanvas().toDataURL('image/png');
    fetch(dataURL).then(res => res.blob()).then(blob => {
        const formData = new FormData(); formData.append('id_paciente', id_paciente); formData.append('id_consulta', consultaOdontograma.id_consulta); formData.append('archivo', blob, `odontograma_${consultaOdontograma.id_consulta}.png`);
        fetch('https://api-clinica-backend-ffw2.onrender.com/odontogramas', { method: 'POST', body: formData }).then(() => { alert("Odontograma guardado permanentemente."); setConsultaOdontograma(null); cargarDatos(); })
      });
  }

  const subirRadiografia = (e) => {
    e.preventDefault()
    if (!fotoFile) return;
    const formData = new FormData(); formData.append('id_paciente', id_paciente); formData.append('id_consulta', modalSubirFoto); formData.append('descripcion', fotoDescripcion); formData.append('archivo', fotoFile);
    fetch('https://api-clinica-backend-ffw2.onrender.com/radiografias', { method: 'POST', body: formData }).then(() => { cargarDatos(); setFotoFile(null); setFotoDescripcion(''); setModalSubirFoto(null); })
  }

  const abrirModalNuevoConsentimiento = () => {
    const proc = "Tratamiento Odontológico General"
    setProcedimientoConsentimiento(proc)
    setTextoConsentimiento(`Yo, ${paciente.nombres} ${paciente.apellidos}, identificado(a) con DNI N° ${paciente.dni}, declaro que he sido debidamente informado(a) por el odontólogo tratante sobre la naturaleza, objetivos, beneficios y posibles riesgos del procedimiento denominado: "${proc}".\n\nHe tenido la oportunidad de formular preguntas y aclarar todas mis dudas. Certifico haber respondido con total veracidad sobre mis antecedentes médicos y alergias, y por medio del presente documento doy mi pleno consentimiento libre y voluntario para la realización del tratamiento.`)
    setMostrarModalFirma(true)
  }

  const guardarFirmaConsentimiento = () => {
    if (firmaRef.current.isEmpty()) { alert("El paciente debe firmar en el recuadro."); return; }
    const dataURL = firmaRef.current.getCanvas().toDataURL('image/png');
    fetch(dataURL).then(res => res.blob()).then(blob => {
        const formData = new FormData(); formData.append('id_paciente', id_paciente); formData.append('procedimiento', procedimientoConsentimiento); formData.append('texto_consentimiento', textoConsentimiento); formData.append('archivo', blob, `firma_${id_paciente}.png`);
        fetch('https://api-clinica-backend-ffw2.onrender.com/consentimientos', { method: 'POST', body: formData }).then(() => { alert("Consentimiento firmado y guardado."); setMostrarModalFirma(false); cargarDatos(); })
      });
  }

  if (!paciente) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><p className="text-gray-500 font-medium">Cargando...</p></div>
  const consultasOrdenadas = [...consultas].reverse()

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <Link to="/" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-800 mb-4 md:mb-6 transition-colors">
          &larr; Volver al Panel de Búsqueda
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-4 md:p-6 mb-6 md:mb-8 border-l-4 border-l-emerald-500">
          <h2 className="text-xl md:text-3xl font-bold text-gray-800 tracking-tight">{paciente.nombres} {paciente.apellidos}</h2>
          <p className="text-gray-500 mt-1 font-medium text-xs md:text-sm">ID: PAC-{String(paciente.id_paciente).padStart(3, '0')} &bull; DNI: {paciente.dni} &bull; Sexo: {paciente.sexo}</p>
        </div>

        {/* CONSENTIMIENTOS */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 md:p-6 mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 border-b pb-3">
            <div>
              <h3 className="text-lg font-bold text-gray-800">Consentimientos Informados</h3>
              <p className="text-xs text-gray-500">Documentos legales autorizados</p>
            </div>
            <button onClick={abrirModalNuevoConsentimiento} className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium w-full sm:w-auto text-center">
              + Redactar y Firmar
            </button>
          </div>
          {consentimientos.length === 0 ? (
            <p className="text-gray-400 text-sm italic py-2">No hay consentimientos legales.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {consentimientos.map(cons => (
                <div key={cons.id_consentimiento} className="border border-gray-200 rounded-xl p-3 md:p-4 bg-gray-50 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 hover:bg-white shadow-sm">
                  <div>
                    <span className="text-[10px] md:text-xs bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded">DOCUMENTO OFICIAL</span>
                    <h4 className="font-bold text-gray-800 mt-1 text-xs md:text-sm">{cons.procedimiento}</h4>
                  </div>
                  <button onClick={() => setVisorConsentimiento(cons)} className="bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg text-xs font-bold w-full sm:w-auto text-center">
                    📄 Ver Doc
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AGENDAR CITA */}
        <div className="bg-white rounded-2xl shadow-sm border border-purple-100 p-4 md:p-6 mb-6 md:mb-8 border-l-4 border-l-purple-500">
          <h3 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b">📅 Agendar Nueva Cita</h3>
          <form onSubmit={agendarCita} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
            <div className="flex flex-col"><label className="text-xs text-gray-500 mb-1 font-bold">Fecha</label><input className="border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-purple-500 w-full text-sm" type="date" name="fecha" value={formAgenda.fecha} onChange={handleChangeAgenda} required /></div>
            <div className="flex flex-col"><label className="text-xs text-gray-500 mb-1 font-bold">Hora</label><input className="border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-purple-500 w-full text-sm" type="time" name="hora" value={formAgenda.hora} onChange={handleChangeAgenda} required /></div>
            <div className="flex flex-col sm:col-span-2 md:col-span-2"><label className="text-xs text-gray-500 mb-1 font-bold">Motivo</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input className="border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-purple-500 w-full text-sm" type="text" name="motivo" placeholder="Ej: Limpieza" value={formAgenda.motivo} onChange={handleChangeAgenda} required />
                <button className="bg-purple-600 text-white font-bold rounded-lg px-4 py-2.5 text-sm whitespace-nowrap" type="submit">Agendar Cita</button>
              </div>
            </div>
          </form>
        </div>

        {/* HISTORIAL CLÍNICO */}
        <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-4 px-2">Historial Clínico</h3>
        {consultasOrdenadas.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center text-gray-500 shadow-sm border border-gray-200">No hay citas registradas.</div>
        ) : (
          <div className="space-y-4 md:space-y-6">
            {consultasOrdenadas.map(c => {
              const tieneOdontograma = odontogramas.find(o => o.id_consulta === c.id_consulta)
              const fotosDeEstaConsulta = radiografias.filter(r => r.id_consulta === c.id_consulta)
              const pendiente = c.diagnostico === 'Por evaluar'

              return (
                <div key={c.id_consulta} className={`bg-white rounded-2xl shadow-sm border ${pendiente ? 'border-orange-200' : 'border-gray-200'} overflow-hidden`}>
                  <div className={`p-3 md:p-4 border-b flex flex-wrap justify-between items-center gap-2 ${pendiente ? 'bg-orange-50' : 'bg-blue-50/50'}`}>
                    <div className="flex items-center flex-wrap gap-2">
                      <span className={`text-[10px] md:text-xs font-bold px-2 md:px-3 py-1 rounded-full ${pendiente ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'}`}>{c.fecha}</span>
                      <span className="text-gray-600 font-medium text-xs md:text-sm">Hora: {c.hora}</span>
                      {pendiente && <span className="text-orange-600 text-[10px] md:text-xs font-bold animate-pulse">⚠️ Pendiente</span>}
                    </div>
                    <span className="text-gray-400 text-xs md:text-sm font-mono">CITA-{c.id_consulta}</span>
                  </div>

                  <div className="p-4 md:p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-2 md:space-y-3 text-xs md:text-sm">
                      <p><span className="font-bold text-gray-700">Motivo:</span> {c.motivo}</p>
                      {!pendiente && (
                        <>
                          <p><span className="font-bold text-gray-700">Diagnóstico:</span> {c.diagnostico}</p>
                          <p><span className="font-bold text-gray-700">Tratamiento:</span> {c.plan_tratamiento}</p>
                          {c.examen_clinico && <p><span className="font-bold text-gray-700">Examen Clínico:</span> {c.examen_clinico}</p>}
                          {c.evolucion && <p><span className="font-bold text-gray-700">Evolución:</span> {c.evolucion}</p>}
                        </>
                      )}
                      <div className="pt-3 mt-3 border-t border-gray-100">
                        <button onClick={() => setConsultaAEditar(c)} className={`px-4 py-2 md:py-2.5 rounded-lg text-xs md:text-sm font-bold w-full text-center transition-colors ${pendiente ? 'bg-orange-500 text-white shadow-md' : 'bg-gray-100 text-gray-700'}`}>
                          {pendiente ? '🩺 Iniciar Atención' : '✏️ Editar Notas Clínicas'}
                        </button>
                      </div>
                    </div>

                    <div className="border-t lg:border-t-0 lg:border-l border-gray-100 pt-4 lg:pt-0 lg:pl-6 space-y-4">
                      <div>
                        <p className="font-bold text-gray-700 text-xs md:text-sm mb-2">Odontograma:</p>
                        {tieneOdontograma ? (
                          <button onClick={() => setVisorOdontograma(tieneOdontograma)} className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-2 rounded-lg text-xs md:text-sm font-bold w-full text-center">✅ Ver Odontograma</button>
                        ) : (
                          <button onClick={() => setConsultaOdontograma(c)} className="bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-lg text-xs md:text-sm font-bold w-full text-center">✍️ Dibujar Odontograma</button>
                        )}
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-2"><p className="font-bold text-gray-700 text-xs md:text-sm">Archivos Adjuntos:</p><button onClick={() => setModalSubirFoto(c.id_consulta)} className="text-[10px] md:text-xs text-blue-600 font-bold">+ Subir archivo</button></div>
                        {fotosDeEstaConsulta.length === 0 ? ( <p className="text-[10px] md:text-xs text-gray-400 italic">No hay fotos.</p> ) : (
                          <div className="flex gap-2 overflow-x-auto pb-2">
                            {fotosDeEstaConsulta.map(rad => (
                              <a key={rad.id_registro} href={`https://api-clinica-backend-ffw2.onrender.com/${rad.ubicacion_archivo}`} target="_blank" rel="noreferrer" className="shrink-0"><img src={`https://api-clinica-backend-ffw2.onrender.com/${rad.ubicacion_archivo}`} alt={rad.tipo} className="w-12 h-12 md:w-16 md:h-16 object-cover rounded-md border border-gray-200" /></a>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* --- MODALES RESPONSIVES --- */}
        {/* Modal Completar Historia */}
        {consultaAEditar && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl p-4 md:p-6 w-full max-w-2xl max-h-[95vh] overflow-y-auto">
              <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-3">🩺 Ficha de Atención Médica</h3>
              <p className="text-xs md:text-sm text-gray-500 mb-4 border-b pb-2">Motivo: <strong>{consultaAEditar.motivo}</strong></p>
              <form onSubmit={guardarHistoriaClinica} className="space-y-3 md:space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                  <div><label className="text-[10px] md:text-xs font-bold text-gray-600">Antecedentes:</label><input type="text" name="antecedentes" value={consultaAEditar.antecedentes || ''} onChange={handleChangeEdicion} className="w-full border rounded p-2 text-xs md:text-sm" /></div>
                  <div><label className="text-[10px] md:text-xs font-bold text-gray-600">Examen Clínico:</label><input type="text" name="examen_clinico" value={consultaAEditar.examen_clinico || ''} onChange={handleChangeEdicion} className="w-full border rounded p-2 text-xs md:text-sm" /></div>
                  <div className="sm:col-span-2"><label className="text-[10px] md:text-xs font-bold text-emerald-600">Diagnóstico *:</label><input type="text" name="diagnostico" value={consultaAEditar.diagnostico === 'Por evaluar' ? '' : consultaAEditar.diagnostico} onChange={handleChangeEdicion} className="w-full border-2 border-emerald-100 rounded p-2 text-xs md:text-sm bg-emerald-50" required /></div>
                  <div className="sm:col-span-2"><label className="text-[10px] md:text-xs font-bold text-blue-600">Plan de Tratamiento *:</label><input type="text" name="plan_tratamiento" value={consultaAEditar.plan_tratamiento === 'Por definir' ? '' : consultaAEditar.plan_tratamiento} onChange={handleChangeEdicion} className="w-full border-2 border-blue-100 rounded p-2 text-xs md:text-sm bg-blue-50" required /></div>
                  <div><label className="text-[10px] md:text-xs font-bold text-gray-600">Evolución / Notas:</label><input type="text" name="evolucion" value={consultaAEditar.evolucion || ''} onChange={handleChangeEdicion} className="w-full border rounded p-2 text-xs md:text-sm" /></div>
                  <div><label className="text-[10px] md:text-xs font-bold text-gray-600">Próximo Control:</label><input type="text" name="proximo_control" value={consultaAEditar.proximo_control || ''} onChange={handleChangeEdicion} className="w-full border rounded p-2 text-xs md:text-sm" /></div>
                </div>
                <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 md:gap-3 mt-4 pt-4 border-t">
                  <button type="button" onClick={() => setConsultaAEditar(null)} className="px-4 py-2 md:py-2.5 text-gray-600 bg-gray-100 rounded-lg text-xs md:text-sm w-full sm:w-auto text-center">Cancelar</button>
                  <button type="submit" className="px-6 py-2 md:py-2.5 bg-blue-600 text-white rounded-lg text-xs md:text-sm font-bold w-full sm:w-auto text-center">Guardar Historia</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Redactar Consentimiento */}
        {mostrarModalFirma && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl p-4 md:p-6 w-full max-w-2xl max-h-[95vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-3 md:mb-4 pb-2 border-b"><h3 className="text-lg md:text-xl font-bold text-gray-800">Redactar y Firmar Consentimiento</h3><button onClick={() => setMostrarModalFirma(false)} className="text-gray-400 font-bold text-lg">✕</button></div>
              <div className="space-y-3 md:space-y-4">
                <div><label className="block text-[10px] md:text-xs font-bold text-gray-700 mb-1">Tratamiento:</label><input type="text" value={procedimientoConsentimiento} onChange={(e) => setProcedimientoConsentimiento(e.target.value)} className="w-full border border-gray-300 rounded p-2 text-xs md:text-sm outline-none focus:border-blue-500" /></div>
                <div><label className="block text-[10px] md:text-xs font-bold text-gray-700 mb-1">Texto Legal:</label><textarea rows="5" value={textoConsentimiento} onChange={(e) => setTextoConsentimiento(e.target.value)} className="w-full border border-gray-300 rounded p-2 text-xs md:text-sm text-gray-700 outline-none focus:border-blue-500" /></div>

                {/* CONTENEDOR CON SCROLL HORIZONTAL PARA FIRMA */}
                <div>
                  <label className="block text-[10px] md:text-xs font-bold text-gray-700 mb-1">Firma Digital (Deslice si es necesario):</label>
                  <div className="w-full overflow-x-auto border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                    <div style={{ width: '600px', height: '140px' }} className="relative shrink-0 mx-auto">
                      <SignatureCanvas ref={firmaRef} penColor="black" canvasProps={{ width: 600, height: 140, className: 'cursor-crosshair absolute top-0 z-10' }} />
                      <span className="absolute bottom-2 left-2 text-gray-400 text-[10px] select-none pointer-events-none">Firme aquí</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row justify-between items-center mt-4 pt-4 border-t gap-3">
                <button onClick={() => firmaRef.current.clear()} className="px-3 py-1.5 text-gray-600 bg-gray-100 rounded text-xs md:text-sm w-full sm:w-auto">Borrar firma</button>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <button onClick={() => setMostrarModalFirma(false)} className="px-4 py-2 md:py-2.5 bg-gray-100 text-gray-700 rounded-lg text-xs md:text-sm font-medium w-full sm:w-auto">Cancelar</button>
                  <button onClick={guardarFirmaConsentimiento} className="px-4 py-2 md:py-2.5 bg-emerald-600 text-white rounded-lg text-xs md:text-sm font-bold shadow w-full sm:w-auto">Firmar y Registrar</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Odontograma (Dibujar) - Con Scroll Horizontal */}
        {consultaOdontograma && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-2 md:p-4">
            <div className="bg-white rounded-xl shadow-xl p-4 md:p-6 w-full max-w-4xl max-h-[95vh] flex flex-col">
              <div className="flex justify-between items-center mb-3"><h3 className="text-base md:text-lg font-bold">Trazar Odontograma</h3><button onClick={() => setConsultaOdontograma(null)} className="text-red-500 font-bold">✕</button></div>

              <div className="w-full overflow-x-auto overflow-y-hidden border-2 border-gray-300 rounded bg-gray-50 flex-1">
                <div className="relative mx-auto" style={{ width: '800px', height: '400px' }}>
                  <img src="/odontograma_fondo.png" alt="Fondo" className="absolute top-0 left-0 w-full h-full object-contain opacity-40 pointer-events-none" />
                  <SignatureCanvas ref={canvasRef} penColor="red" canvasProps={{ width: 800, height: 400, className: 'absolute top-0 left-0 z-10 cursor-crosshair' }} />
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 md:gap-3 mt-4">
                <button onClick={() => canvasRef.current.clear()} className="px-4 py-2 bg-gray-100 rounded text-xs md:text-sm w-full sm:w-auto">Borrar trazos</button>
                <button onClick={guardarOdontograma} className="px-4 py-2 bg-emerald-600 text-white rounded text-xs md:text-sm font-bold w-full sm:w-auto">Guardar Definitivo</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Odontograma (Ver) - Con Scroll Horizontal */}
        {visorOdontograma && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-2 md:p-4">
            <div className="bg-white rounded-xl shadow-xl p-4 md:p-6 w-full max-w-4xl max-h-[95vh] flex flex-col">
              <div className="flex justify-between items-center mb-3"><h3 className="text-base md:text-lg font-bold">Odontograma Guardado</h3><button onClick={() => setVisorOdontograma(null)} className="text-red-500 font-bold">✕</button></div>

              <div className="w-full overflow-x-auto border-2 border-gray-300 rounded bg-white flex-1">
                <div className="relative mx-auto" style={{ width: '800px', height: '400px' }}>
                  <img src="/odontograma_fondo.png" alt="Fondo" className="absolute top-0 left-0 w-full h-full object-contain opacity-40 pointer-events-none" />
                  <img src={`https://api-clinica-backend-ffw2.onrender.com/${visorOdontograma.ubicacion_archivo}`} alt="Trazos" className="absolute top-0 left-0 w-full h-full object-contain pointer-events-none" />
                </div>
              </div>
              <div className="mt-4 text-right">
                <button onClick={() => setVisorOdontograma(null)} className="px-4 py-2 bg-gray-800 text-white rounded text-sm w-full sm:w-auto">Cerrar Visor</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Visor Documento Legal Completo */}
        {visorConsentimiento && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-2 md:p-4">
            <div className="bg-white rounded-xl md:rounded-2xl shadow-2xl p-4 md:p-8 w-full max-w-2xl max-h-[92vh] overflow-y-auto">
              <div className="text-center border-b-2 border-slate-800 pb-3 md:pb-4 mb-4 md:mb-6">
                <h2 className="text-lg md:text-xl font-extrabold tracking-widest text-slate-800 uppercase">Clínica Odontológica</h2>
                <p className="text-[10px] md:text-xs font-semibold text-slate-500 mt-0.5 tracking-wider uppercase">Consentimiento Informado</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 md:p-4 mb-4 md:mb-6 text-[10px] md:text-xs text-gray-700 grid grid-cols-2 gap-2 border border-gray-200">
                <p><span className="font-bold">Paciente:</span> {paciente.nombres}</p><p><span className="font-bold">DNI:</span> {paciente.dni}</p>
                <p className="col-span-2"><span className="font-bold">Procedimiento:</span> <span className="text-blue-700">{visorConsentimiento.procedimiento}</span></p>
              </div>
              <div className="text-xs md:text-sm text-gray-800 leading-relaxed whitespace-pre-wrap text-justify bg-white p-2 mb-6 font-serif">
                {visorConsentimiento.texto_consentimiento}
              </div>
              <div className="flex flex-col items-center justify-center pt-4 border-t border-dashed border-gray-300">
                <div className="h-16 md:h-20 mb-1 flex items-center justify-center"><img src={`https://api-clinica-backend-ffw2.onrender.com/${visorConsentimiento.ubicacion_firma}`} alt="Firma registrada" className="h-full object-contain" /></div>
                <div className="w-48 md:w-64 border-t border-gray-800 text-center pt-1"><p className="text-[10px] md:text-xs font-bold text-gray-800">{paciente.nombres} {paciente.apellidos}</p><p className="text-[9px] md:text-[11px] text-gray-500">DNI: {paciente.dni}</p></div>
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-2 md:gap-3 mt-6 pt-4 border-t border-gray-100">
                <button onClick={() => window.print()} className="px-4 py-2 bg-slate-100 text-slate-800 text-xs md:text-sm font-bold rounded-lg w-full sm:w-auto text-center">🖨️ Imprimir</button>
                <button onClick={() => setVisorConsentimiento(null)} className="px-5 py-2 bg-slate-800 text-white text-xs md:text-sm font-bold rounded-lg w-full sm:w-auto text-center">Cerrar</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Subir Foto */}
        {modalSubirFoto && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-4 md:p-6 w-full max-w-md"><h3 className="text-base md:text-lg font-bold mb-4">Subir Archivo</h3><form onSubmit={subirRadiografia} className="space-y-3 md:space-y-4"><input type="file" onChange={(e) => setFotoFile(e.target.files[0])} className="w-full border rounded p-2 text-xs md:text-sm" required /><input type="text" placeholder="Descripción" value={fotoDescripcion} onChange={(e) => setFotoDescripcion(e.target.value)} className="w-full border rounded p-2 text-xs md:text-sm" required /><div className="flex flex-col-reverse sm:flex-row justify-end gap-2"><button type="button" onClick={() => setModalSubirFoto(null)} className="px-4 py-2 bg-gray-100 rounded text-xs md:text-sm w-full sm:w-auto">Cancelar</button><button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded text-xs md:text-sm font-bold w-full sm:w-auto">Subir</button></div></form></div>
          </div>
        )}

      </div>
    </div>
  )
}

// --- PANTALLA 0: LOGIN PROFESIONAL ---
function PantallaLogin({ onLogin }) {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setCargando(true);
    setError('');

    // FastAPI (OAuth2) exige que los datos se envíen como formulario codificado, no como JSON
    const formData = new URLSearchParams();
    formData.append('username', usuario);
    formData.append('password', password);

    fetch('https://api-clinica-backend-ffw2.onrender.com/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData
    })
    .then(async (res) => {
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Credenciales inválidas");
      }
      return res.json();
    })
    .then(data => {
      // Guardamos el token encriptado en el navegador (Almacenamiento Local)
      localStorage.setItem('token', data.access_token);
      onLogin(); // Damos acceso al sistema
    })
    .catch(err => {
      setError(err.message);
      setCargando(false);
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        <div className="bg-slate-800 p-8 text-center">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-4xl">🦷</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-wide">Clínica Odontológica</h1>
          <p className="text-slate-300 text-sm mt-2 font-medium">Acceso Restringido</p>
        </div>

        <div className="p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">Iniciar Sesión</h2>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center mb-6 border border-red-100 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Usuario</label>
              <input
                type="text"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-emerald-500 bg-gray-50 focus:bg-white transition-colors"
                placeholder="Ej: admin"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-emerald-500 bg-gray-50 focus:bg-white transition-colors"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={cargando}
              className={`w-full text-white font-bold rounded-lg p-3 mt-4 transition-colors shadow-md ${cargando ? 'bg-emerald-400' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
              {cargando ? 'Verificando...' : 'Ingresar de forma segura'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// --- APP PRINCIPAL (CONTROL DE RUTAS Y SESIÓN) ---
export default function App() {
  // Verificamos si ya hay un token guardado en el navegador para no pedir login en cada recarga
  const [autenticado, setAutenticado] = useState(!!localStorage.getItem('token'));

  // Componente extra para agregar un botón de Cerrar Sesión global
  const CerrarSesionBtn = () => (
    <button
      onClick={() => { localStorage.removeItem('token'); setAutenticado(false); }}
      className="fixed bottom-4 right-4 bg-slate-800 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg hover:bg-slate-900 z-50">
      Cerrar Sesión 🔒
    </button>
  );

  if (!autenticado) {
    return <PantallaLogin onLogin={() => setAutenticado(true)} />;
  }

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<PanelPrincipal />} />
          <Route path="/ficha/:id_paciente" element={<FichaClinica />} />
        </Routes>
      </BrowserRouter>
      <CerrarSesionBtn />
    </>
  );
}