# 🧠 Architectural Decisions

### Design Patterns & Logic

Se implementó un diseño **OOP con un Patrón de Reglas** para las validaciones de seguros. Esta decisión permite que el sistema sea **extensible y mantenible**; nuevas reglas de negocio pueden añadirse como objetos independientes sin alterar el flujo principal de ingesta, respetando el principio Open/Closed.

### Data Integrity & Error Handling

Para mitigar el impacto de **datos sucios en el CSV**, se diseñó una capa de sanitización previa a la persistencia. Los registros malformados no detienen el proceso; se capturan y marcan como `rejected` con su respectivo `correlation_id`, asegurando que solo información íntegra llegue a PostgreSQL.

### Architecture: Node.js + Python

Se optó por una arquitectura de **microservicios desacoplados** en lugar de un monolito:

- **Node.js:** Gestiona eficientemente la concurrencia y el I/O intensivo del procesamiento de archivos.
- **Python:** Provee acceso nativo al ecosistema de **LangChain**, permitiendo que el servicio de IA escale independientemente del servicio de ingesta de datos.

### AI Strategy & LLM Choice

Se seleccionó **`gpt-4o-mini` via OpenRouter** por su baja latencia y precisión en **Tool Calling**. Ofrece el mejor balance costo-beneficio para generar queries SQL complejas sin el consumo excesivo de recursos de modelos de mayor escala.

### Idempotency & Scalability

- **Idempotencia:** Se garantiza mediante llaves naturales en el CSV y cláusulas `ON CONFLICT` en la base de datos, evitando duplicados ante re-intentos de carga.
- **Escalabilidad:** Se utiliza **Connection Pooling** (SQLAlchemy) para optimizar el acceso a datos. A futuro, se contempla **Caching** con Redis y **Streaming** de tokens para mejorar la UX en reportes extensos.

### Tradeoffs

Se priorizó la **consistencia y observabilidad** sobre la velocidad pura de inserción. Un flujo trazable con logs estructurados asegura que cada póliza procesada sea auditable, un requisito crítico en el dominio de seguros.
