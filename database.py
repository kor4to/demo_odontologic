from sqlmodel import SQLModel, Field, Relationship, create_engine, Session
from typing import Optional, List
from datetime import date, time
from passlib.context import CryptContext
from sqlmodel import Field


# --- MODELOS (TABLAS) ---

class Paciente(SQLModel, table=True):
    id_paciente: Optional[int] = Field(default=None, primary_key=True)
    dni: str = Field(index=True, unique=True)
    nombres: str
    apellidos: str
    fecha_nacimiento: date
    sexo: str
    telefono: Optional[str] = None
    correo: Optional[str] = None
    direccion: Optional[str] = None

    # Relaciones
    consultas: List["Consulta"] = Relationship(back_populates="paciente")
    fotos: List["RegistroFotografico"] = Relationship(back_populates="paciente")
    consentimientos: List["Consentimiento"] = Relationship(back_populates="paciente")


class Consulta(SQLModel, table=True):
    id_consulta: Optional[int] = Field(default=None, primary_key=True)
    id_paciente: int = Field(foreign_key="paciente.id_paciente")
    fecha: date
    hora: time
    motivo: str
    signos_vitales: Optional[str] = None
    antecedentes: Optional[str] = None
    examen_clinico: Optional[str] = None
    diagnostico: str
    plan_tratamiento: str
    evolucion: Optional[str] = None
    proximo_control: Optional[str] = None

    # Relaciones
    paciente: Paciente = Relationship(back_populates="consultas")
    odontogramas: List["Odontograma"] = Relationship(back_populates="consulta")


class Odontograma(SQLModel, table=True):
    id_odontograma: Optional[int] = Field(default=None, primary_key=True)
    id_paciente: int = Field(foreign_key="paciente.id_paciente")
    id_consulta: int = Field(foreign_key="consulta.id_consulta")
    fecha: date
    ubicacion_archivo: str  # Ruta donde se guardará la imagen en el servidor

    # Relación
    consulta: Consulta = Relationship(back_populates="odontogramas")


class RegistroFotografico(SQLModel, table=True):
    id_foto: Optional[int] = Field(default=None, primary_key=True)
    id_paciente: int = Field(foreign_key="paciente.id_paciente")
    id_consulta: Optional[int] = Field(default=None, foreign_key="consulta.id_consulta")
    fecha: date
    tipo: str
    ubicacion_archivo: str
    observaciones: Optional[str] = None

    paciente: Paciente = Relationship(back_populates="fotos")


class Consentimiento(SQLModel, table=True):
    id_consentimiento: Optional[int] = Field(default=None, primary_key=True)
    id_paciente: int = Field(foreign_key="paciente.id_paciente")
    procedimiento: str
    texto_consentimiento: str
    ubicacion_firma: str  # Ruta de la imagen de la firma

    paciente: Paciente = Relationship(back_populates="consentimientos")



# --- MODELO DE SEGURIDAD ---
class Usuario(SQLModel, table=True):
    id_usuario: int | None = Field(default=None, primary_key=True)
    username: str = Field(unique=True, index=True)
    password_hash: str # Aquí guardaremos la clave encriptada, NUNCA en texto plano

# Configuramos el encriptador y la clave secreta del servidor
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = "clave_super_secreta_clinica_odontologica"
ALGORITHM = "HS256"


# --- CONFIGURACIÓN DEL MOTOR SQLite ---

# Crea un archivo local llamado "clinica.db"
sqlite_file_name = "clinica.db"
sqlite_url = f"sqlite:///{sqlite_file_name}"

# El engine es el motor que se comunica con la base de datos
engine = create_engine(sqlite_url, echo=True)


def crear_base_datos():
    # Esta instrucción lee todas las clases de arriba y crea las tablas
    SQLModel.metadata.create_all(engine)
    print("¡Base de datos y tablas creadas con éxito!")


if __name__ == "__main__":
    crear_base_datos()