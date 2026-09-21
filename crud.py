from sqlmodel import Session, select
from datetime import date, time
from database import engine, Paciente, Consulta


def registrar_paciente_prueba():
    # Iniciamos una sesión con la base de datos
    with Session(engine) as session:
        # 1. Creamos el objeto Paciente basándonos en tu Excel
        nuevo_paciente = Paciente(
            dni="12345678",
            nombres="Sofía",
            apellidos="Suárez Méndez",
            fecha_nacimiento=date(1990, 5, 15),  # Ejemplo
            sexo="F"
        )

        # 2. Lo añadimos a la sesión y guardamos (commit)
        session.add(nuevo_paciente)
        session.commit()

        # 3. Refrescamos para obtener el ID generado automáticamente
        session.refresh(nuevo_paciente)
        print(
            f"✅ Paciente registrada: {nuevo_paciente.nombres} {nuevo_paciente.apellidos} con ID: {nuevo_paciente.id_paciente}")

        return nuevo_paciente


def registrar_consulta_prueba(id_paciente: int):
    with Session(engine) as session:
        # Creamos la consulta usando los datos de tu pestaña "Ficha Clínica"
        nueva_consulta = Consulta(
            id_paciente=id_paciente,
            fecha=date.today(),
            hora=time(15, 30),
            motivo="dolor agudo",
            antecedentes="hipertension y diabetes emotiva",
            examen_clinico="normal",
            diagnostico="pulpitis irreversible",
            plan_tratamiento="endo. Pza.1.6",
            evolucion="favorable",
            proximo_control="mensual"
        )

        session.add(nueva_consulta)
        session.commit()
        print(f"✅ Consulta registrada con éxito para el Paciente ID: {id_paciente}")


def leer_historial_paciente(id_paciente: int):
    with Session(engine) as session:
        # Buscamos al paciente por su ID
        paciente = session.get(Paciente, id_paciente)

        if paciente:
            print("\n--- HISTORIAL CLÍNICO ---")
            print(f"Paciente: {paciente.nombres} {paciente.apellidos}")
            print("Consultas previas:")
            for consulta in paciente.consultas:
                print(f"- {consulta.fecha}: {consulta.motivo} -> {consulta.diagnostico}")
            print("-------------------------\n")


if __name__ == "__main__":
    print("Iniciando pruebas de base de datos...\n")

    # 1. Registramos a Sofía
    paciente_creado = registrar_paciente_prueba()

    # 2. Le registramos una consulta usando su ID
    registrar_consulta_prueba(paciente_creado.id_paciente)

    # 3. Leemos su historial para comprobar que las tablas están conectadas
    leer_historial_paciente(paciente_creado.id_paciente)