import os
import shutil
from fastapi import FastAPI, Depends, UploadFile, File, Form
from sqlmodel import Session, select, SQLModel
from typing import List
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from datetime import datetime
from database import engine, Paciente, Consulta, Odontograma, RegistroFotografico, Consentimiento, pwd_context, Usuario, \
    SECRET_KEY, ALGORITHM
import jwt
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordRequestForm
from fastapi import HTTPException
from sqlmodel import Field

# --- CREAR CARPETA PARA IMÁGENES ---
os.makedirs("archivos/odontogramas", exist_ok=True)
os.makedirs("archivos/radiografias", exist_ok=True)
os.makedirs("archivos/consentimientos", exist_ok=True)

app = FastAPI(title="API Clínica Odontológica")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Permite conexiones desde cualquier URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Permitir que React pueda acceder a las imágenes guardadas a través de una URL
app.mount("/archivos", StaticFiles(directory="archivos"), name="archivos")


def get_session():
    with Session(engine) as session:
        yield session


@app.get("/")
def ruta_raiz():
    return {"mensaje": "API de la Clínica Odontológica en línea"}


@app.get("/pacientes", response_model=List[Paciente])
def obtener_pacientes(session: Session = Depends(get_session)):
    return session.exec(select(Paciente)).all()


@app.post("/pacientes", response_model=Paciente)
def crear_paciente(paciente: Paciente, session: Session = Depends(get_session)):
    if isinstance(paciente.fecha_nacimiento, str):
        paciente.fecha_nacimiento = datetime.strptime(paciente.fecha_nacimiento, "%Y-%m-%d").date()
    session.add(paciente)
    session.commit()
    session.refresh(paciente)
    return paciente


@app.get("/pacientes/{id_paciente}", response_model=Paciente)
def obtener_paciente(id_paciente: int, session: Session = Depends(get_session)):
    return session.get(Paciente, id_paciente)


@app.get("/pacientes/{id_paciente}/consultas", response_model=List[Consulta])
def obtener_consultas_paciente(id_paciente: int, session: Session = Depends(get_session)):
    return session.exec(select(Consulta).where(Consulta.id_paciente == id_paciente)).all()


@app.post("/consultas", response_model=Consulta)
def crear_consulta(consulta: Consulta, session: Session = Depends(get_session)):
    if isinstance(consulta.fecha, str):
        consulta.fecha = datetime.strptime(consulta.fecha, "%Y-%m-%d").date()
    if isinstance(consulta.hora, str):
        consulta.hora = datetime.strptime(consulta.hora[0:5], "%H:%M").time()
    session.add(consulta)
    session.commit()
    session.refresh(consulta)
    return consulta


# --- NUEVA RUTA PARA GUARDAR EL ODONTOGRAMA ---
@app.post("/odontogramas")
def subir_odontograma(
        id_paciente: int = Form(...),
        id_consulta: int = Form(...),
        archivo: UploadFile = File(...),
        session: Session = Depends(get_session)
):
    # Generamos un nombre único para el archivo
    nombre_archivo = f"pac_{id_paciente}_cons_{id_consulta}.png"
    ruta_destino = f"archivos/odontogramas/{nombre_archivo}"

    # Guardamos la imagen físicamente en la carpeta
    with open(ruta_destino, "wb") as buffer:
        shutil.copyfileobj(archivo.file, buffer)

    # Guardamos el registro en la base de datos SQL
    nuevo_odontograma = Odontograma(
        id_paciente=id_paciente,
        id_consulta=id_consulta,
        fecha=datetime.now().date(),
        ubicacion_archivo=ruta_destino
    )
    session.add(nuevo_odontograma)
    session.commit()

    return {"mensaje": "Odontograma guardado", "ruta": ruta_destino}


# --- RUTAS PARA REGISTRO FOTOGRÁFICO ---
@app.post("/radiografias")
def subir_radiografia(
        id_paciente: int = Form(...),
        id_consulta: int = Form(...),  # NUEVO: Vinculamos la foto a la consulta
        descripcion: str = Form(...),
        archivo: UploadFile = File(...),
        session: Session = Depends(get_session)
):
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    nombre_archivo = f"pac_{id_paciente}_cons_{id_consulta}_{timestamp}_{archivo.filename}"
    ruta_destino = f"archivos/radiografias/{nombre_archivo}"

    with open(ruta_destino, "wb") as buffer:
        shutil.copyfileobj(archivo.file, buffer)

    nuevo_registro = RegistroFotografico(
        id_paciente=id_paciente,
        id_consulta=id_consulta,  # ASIGNAMOS EL ID AQUÍ
        fecha=datetime.now().date(),
        tipo=descripcion,
        ubicacion_archivo=ruta_destino
    )
    session.add(nuevo_registro)
    session.commit()

    return {"mensaje": "Radiografía guardada correctamente"}


# --- RUTA PARA OBTENER LAS FOTOS DE UN PACIENTE ---
@app.get("/pacientes/{id_paciente}/radiografias")
def obtener_radiografias(id_paciente: int, session: Session = Depends(get_session)):
    return session.exec(select(RegistroFotografico).where(RegistroFotografico.id_paciente == id_paciente)).all()

# NUEVA RUTA PARA EL HISTORIAL DE ODONTOGRAMAS
@app.get("/pacientes/{id_paciente}/odontogramas")
def obtener_odontogramas(id_paciente: int, session: Session = Depends(get_session)):
    return session.exec(select(Odontograma).where(Odontograma.id_paciente == id_paciente)).all()


@app.post("/consentimientos")
def subir_consentimiento(
        id_paciente: int = Form(...),
        procedimiento: str = Form(...),  # NUEVO: Recibe el procedimiento del formulario
        texto_consentimiento: str = Form(...),  # NUEVO: Recibe el texto legal exacto editado
        archivo: UploadFile = File(...),
        session: Session = Depends(get_session)
):
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    nombre_archivo = f"firma_paciente_{id_paciente}_{timestamp}.png"
    ruta_destino = f"archivos/consentimientos/{nombre_archivo}"

    with open(ruta_destino, "wb") as buffer:
        shutil.copyfileobj(archivo.file, buffer)

    nuevo_consentimiento = Consentimiento(
        id_paciente=id_paciente,
        procedimiento=procedimiento,
        texto_consentimiento=texto_consentimiento,
        ubicacion_firma=ruta_destino
    )
    session.add(nuevo_consentimiento)
    session.commit()

    return {"mensaje": "Consentimiento guardado correctamente"}
@app.get("/pacientes/{id_paciente}/consentimientos")
def obtener_consentimientos(id_paciente: int, session: Session = Depends(get_session)):
    return session.exec(select(Consentimiento).where(Consentimiento.id_paciente == id_paciente)).all()

# --- NUEVA RUTA: AGENDA / CALENDARIO ---
@app.get("/agenda")
def obtener_agenda(session: Session = Depends(get_session)):
    consultas = session.exec(select(Consulta)).all()
    agenda = []
    for c in consultas:
        paciente = session.get(Paciente, c.id_paciente)
        if paciente:
            agenda.append({
                "id_consulta": c.id_consulta,
                "fecha": str(c.fecha),
                "hora": str(c.hora)[:5] if c.hora else "",
                "paciente": f"{paciente.nombres} {paciente.apellidos}",
                "motivo": c.motivo,
                "id_paciente": c.id_paciente
            })
    # Ordenamos de la cita más antigua a la más nueva
    agenda.sort(key=lambda x: (x["fecha"], x["hora"]))
    return agenda


# --- RUTA PARA ACTUALIZAR (COMPLETAR) UNA CONSULTA ---
@app.put("/consultas/{id_consulta}")
def actualizar_consulta(id_consulta: int, datos: Consulta, session: Session = Depends(get_session)):
    consulta_db = session.get(Consulta, id_consulta)
    if not consulta_db:
        return {"error": "Consulta no encontrada"}

    # Actualizamos solo los datos clínicos
    consulta_db.antecedentes = datos.antecedentes
    consulta_db.examen_clinico = datos.examen_clinico
    consulta_db.diagnostico = datos.diagnostico
    consulta_db.plan_tratamiento = datos.plan_tratamiento
    consulta_db.evolucion = datos.evolucion
    consulta_db.proximo_control = datos.proximo_control

    session.add(consulta_db)
    session.commit()
    session.refresh(consulta_db)
    return consulta_db


# --- RUTAS DE SEGURIDAD Y LOGIN ---

# Esto se ejecutará cada vez que inicies el servidor para asegurar que exista tu usuario admin
@app.on_event("startup")
def crear_usuario_admin():
    with Session(engine) as session:
        # Creamos las tablas si hay alguna nueva (como la de Usuario)
        SQLModel.metadata.create_all(engine)

        usuario = session.exec(select(Usuario).where(Usuario.username == "admin")).first()
        if not usuario:
            # Encriptamos la contraseña 'admin123' antes de guardarla
            hash_pass = pwd_context.hash("admin123")
            nuevo = Usuario(username="admin", password_hash=hash_pass)
            session.add(nuevo)
            session.commit()
            print("Usuario administrador creado de forma segura.")


# Ruta donde React enviará el usuario y contraseña para que FastAPI los valide
@app.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), session: Session = Depends(get_session)):
    user = session.exec(select(Usuario).where(Usuario.username == form_data.username)).first()

    # Verificamos si existe y si la contraseña coincide con el hash matemático
    if not user or not pwd_context.verify(form_data.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Usuario o contraseña incorrectos")

    # Generamos un Token VIP válido
    token = jwt.encode({"sub": user.username}, SECRET_KEY, algorithm=ALGORITHM)
    return {"access_token": token, "token_type": "bearer"}