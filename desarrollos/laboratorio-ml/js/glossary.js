/* Glosario: categoría (c), término (t), definición (d), ecuación (f), interpretación (i) */
window.GLOSSARY = {
 "es": {
  "cats": {
   "concept": "Conceptos básicos",
   "prep": "Preparación de datos",
   "model": "Modelos",
   "cls": "Métricas de clasificación",
   "reg": "Métricas de regresión"
  },
  "labels": {
   "def": "Definición",
   "eq": "Ecuación",
   "interp": "Interpretación"
  },
  "items": [
   {
    "c": "concept",
    "t": "Dataset",
    "d": "Tabla de datos: cada fila es un ejemplo y cada columna una característica."
   },
   {
    "c": "concept",
    "t": "Feature (variable predictora)",
    "d": "Columna que el modelo usa como pista para predecir. Al conjunto de features se le llama X."
   },
   {
    "c": "concept",
    "t": "Target (variable objetivo)",
    "d": "Columna que queremos predecir. Se le llama y; la predicción del modelo es ŷ."
   },
   {
    "c": "concept",
    "t": "Clasificación",
    "d": "Predecir una categoría (clase), por ejemplo la especie de un pingüino."
   },
   {
    "c": "concept",
    "t": "Regresión",
    "d": "Predecir un número, por ejemplo cuántos helados se venden."
   },
   {
    "c": "concept",
    "t": "Conjunto de entrenamiento",
    "d": "Filas con las que el modelo aprende."
   },
   {
    "c": "concept",
    "t": "Conjunto de validación",
    "d": "Filas que el modelo no usó para aprender. Sirven para comparar modelos e hiperparámetros."
   },
   {
    "c": "concept",
    "t": "Conjunto de prueba (test)",
    "d": "Filas guardadas para la evaluación final, con datos que el modelo nunca vio."
   },
   {
    "c": "concept",
    "t": "Hiperparámetro",
    "d": "Ajuste que eliges antes de entrenar, como la profundidad de un árbol."
   },
   {
    "c": "concept",
    "t": "Overfitting (sobreajuste)",
    "d": "El modelo se aprende de memoria los datos de entrenamiento y falla con datos nuevos.",
    "i": "Se corrige con un modelo más simple."
   },
   {
    "c": "concept",
    "t": "Underfitting (subajuste)",
    "d": "El modelo es demasiado simple y no logra captar el patrón de los datos.",
    "i": "Se corrige con un modelo más flexible."
   },
   {
    "c": "concept",
    "t": "Inferencia",
    "d": "Usar el modelo ya entrenado para predecir un caso nuevo."
   },
   {
    "c": "prep",
    "t": "Imputación",
    "d": "Rellenar los valores faltantes con la media, la mediana, la moda o el valor de los vecinos más parecidos (KNN).",
    "f": "x̂ = (1/n) Σ xᵢ   ó   x̂ = mediana(x)"
   },
   {
    "c": "prep",
    "t": "One-hot encoding",
    "d": "Convierte una columna de categorías en varias columnas de 0 y 1, una por categoría."
   },
   {
    "c": "prep",
    "t": "Estandarización (StandardScaler)",
    "d": "Cambia la escala de cada feature para que tenga media 0 y desviación estándar 1.",
    "f": "z = (x − μ) / σ"
   },
   {
    "c": "prep",
    "t": "Normalización min-max (MinMaxScaler)",
    "d": "Cambia la escala de cada feature para que quede entre 0 y 1.",
    "f": "x′ = (x − mín) / (máx − mín)"
   },
   {
    "c": "model",
    "t": "Regresión lineal",
    "d": "Busca la recta que mejor se ajusta a los datos.",
    "f": "ŷ = β₀ + β₁x₁ + β₂x₂ + …"
   },
   {
    "c": "model",
    "t": "Regresión logística",
    "d": "Separa las clases con una frontera recta y entrega una probabilidad para cada clase."
   },
   {
    "c": "model",
    "t": "SVM",
    "d": "Busca la frontera que deja el mayor margen entre las clases. Con un kernel, la frontera puede ser curva."
   },
   {
    "c": "model",
    "t": "Árbol de decisión",
    "d": "Hace preguntas de sí o no sobre las features hasta llegar a una respuesta."
   },
   {
    "c": "model",
    "t": "Random Forest",
    "d": "Muchos árboles distintos que votan (clasificación) o se promedian (regresión)."
   },
   {
    "c": "model",
    "t": "Gradient Boosting",
    "d": "Árboles en fila: cada uno corrige los errores de los anteriores. Es la idea detrás de XGBoost."
   },
   {
    "c": "model",
    "t": "Naive Bayes",
    "d": "Mira cada feature por separado y se pregunta qué tan común es ese valor en cada clase; luego combina las pistas con probabilidades. Es «ingenuo» porque supone que las features no se relacionan entre sí."
   },
   {
    "c": "cls",
    "t": "Matriz de confusión",
    "d": "Tabla que compara la clase real con la predicha. VP y VN son aciertos; FP y FN son errores."
   },
   {
    "c": "cls",
    "t": "Exactitud (accuracy)",
    "d": "Porcentaje de predicciones correctas.",
    "f": "Acc = (VP + VN) / (VP + VN + FP + FN)",
    "i": "Puede engañar si una clase tiene muchas más filas que otra."
   },
   {
    "c": "cls",
    "t": "Exactitud balanceada",
    "d": "Promedio de la sensibilidad de cada clase. Es más justa cuando las clases están desbalanceadas."
   },
   {
    "c": "cls",
    "t": "Precisión",
    "d": "Cuando el modelo dice «positivo», ¿qué tan seguido acierta?",
    "f": "PPV = VP / (VP + FP)",
    "i": "Importa cuando una falsa alarma sale cara."
   },
   {
    "c": "cls",
    "t": "Sensibilidad (recall)",
    "d": "De todos los positivos reales, ¿cuántos encontró el modelo?",
    "f": "TPR = VP / (VP + FN)",
    "i": "Importa cuando no detectar un caso sale caro."
   },
   {
    "c": "cls",
    "t": "Especificidad",
    "d": "De todos los negativos reales, ¿cuántos identificó bien el modelo?",
    "f": "TNR = VN / (VN + FP)"
   },
   {
    "c": "cls",
    "t": "F1-score",
    "d": "Combina precisión y sensibilidad en un solo número.",
    "f": "F1 = 2 · PPV · TPR / (PPV + TPR)",
    "i": "Es bajo si cualquiera de las dos es baja."
   },
   {
    "c": "cls",
    "t": "Curva ROC y AUC",
    "d": "La curva muestra la sensibilidad frente a las falsas alarmas al mover el umbral de decisión. El AUC es el área bajo la curva.",
    "i": "AUC = 0,5 es adivinar al azar; AUC = 1 es perfecto."
   },
   {
    "c": "reg",
    "t": "Residuo",
    "d": "Diferencia entre el valor real y el predicho.",
    "f": "eᵢ = yᵢ − ŷᵢ"
   },
   {
    "c": "reg",
    "t": "R²",
    "d": "Qué parte de la variación del target explica el modelo.",
    "f": "R² = 1 − Σ(yᵢ − ŷᵢ)² / Σ(yᵢ − ȳ)²",
    "i": "1 es perfecto; 0 es igual que predecir siempre el promedio."
   },
   {
    "c": "reg",
    "t": "MAE (error absoluto medio)",
    "d": "En promedio, cuánto se equivoca el modelo.",
    "f": "MAE = (1/n) Σ |yᵢ − ŷᵢ|",
    "i": "Está en las mismas unidades del target."
   },
   {
    "c": "reg",
    "t": "MSE (error cuadrático medio)",
    "d": "Promedio de los errores al cuadrado.",
    "f": "MSE = (1/n) Σ (yᵢ − ŷᵢ)²",
    "i": "Castiga más los errores grandes."
   },
   {
    "c": "reg",
    "t": "MAPE (error porcentual medio)",
    "d": "En promedio, qué porcentaje se equivoca el modelo.",
    "f": "MAPE = (100 % / n) Σ |(yᵢ − ŷᵢ) / yᵢ|"
   }
  ]
 },
 "en": {
  "cats": {
   "concept": "Basic concepts",
   "prep": "Data preparation",
   "model": "Models",
   "cls": "Classification metrics",
   "reg": "Regression metrics"
  },
  "labels": {
   "def": "Definition",
   "eq": "Equation",
   "interp": "Interpretation"
  },
  "items": [
   {
    "c": "concept",
    "t": "Dataset",
    "d": "A table of data: each row is an example and each column a characteristic."
   },
   {
    "c": "concept",
    "t": "Feature (predictor)",
    "d": "A column the model uses as a clue to predict. The set of features is called X."
   },
   {
    "c": "concept",
    "t": "Target",
    "d": "The column we want to predict. It is called y; the model's prediction is ŷ."
   },
   {
    "c": "concept",
    "t": "Classification",
    "d": "Predicting a category (class), for example a penguin's species."
   },
   {
    "c": "concept",
    "t": "Regression",
    "d": "Predicting a number, for example how many ice creams are sold."
   },
   {
    "c": "concept",
    "t": "Training set",
    "d": "Rows the model learns from."
   },
   {
    "c": "concept",
    "t": "Validation set",
    "d": "Rows the model did not learn from. Used to compare models and hyperparameters."
   },
   {
    "c": "concept",
    "t": "Test set",
    "d": "Rows kept for the final evaluation, with data the model has never seen."
   },
   {
    "c": "concept",
    "t": "Hyperparameter",
    "d": "A setting you choose before training, such as the depth of a tree."
   },
   {
    "c": "concept",
    "t": "Overfitting",
    "d": "The model memorizes the training data and fails on new data.",
    "i": "Fixed by using a simpler model."
   },
   {
    "c": "concept",
    "t": "Underfitting",
    "d": "The model is too simple and misses the pattern in the data.",
    "i": "Fixed by using a more flexible model."
   },
   {
    "c": "concept",
    "t": "Inference",
    "d": "Using the trained model to predict a new case."
   },
   {
    "c": "prep",
    "t": "Imputation",
    "d": "Filling in missing values with the mean, the median, the mode or the value of the most similar neighbors (KNN).",
    "f": "x̂ = (1/n) Σ xᵢ   or   x̂ = median(x)"
   },
   {
    "c": "prep",
    "t": "One-hot encoding",
    "d": "Turns a column of categories into several 0/1 columns, one per category."
   },
   {
    "c": "prep",
    "t": "Standardization (StandardScaler)",
    "d": "Rescales each feature to have mean 0 and standard deviation 1.",
    "f": "z = (x − μ) / σ"
   },
   {
    "c": "prep",
    "t": "Min-max normalization (MinMaxScaler)",
    "d": "Rescales each feature to lie between 0 and 1.",
    "f": "x′ = (x − min) / (max − min)"
   },
   {
    "c": "model",
    "t": "Linear regression",
    "d": "Finds the straight line that best fits the data.",
    "f": "ŷ = β₀ + β₁x₁ + β₂x₂ + …"
   },
   {
    "c": "model",
    "t": "Logistic regression",
    "d": "Separates classes with a straight boundary and gives a probability for each class."
   },
   {
    "c": "model",
    "t": "SVM",
    "d": "Finds the boundary with the widest margin between classes. With a kernel, the boundary can be curved."
   },
   {
    "c": "model",
    "t": "Decision tree",
    "d": "Asks yes/no questions about the features until it reaches an answer."
   },
   {
    "c": "model",
    "t": "Random Forest",
    "d": "Many different trees that vote (classification) or are averaged (regression)."
   },
   {
    "c": "model",
    "t": "Gradient Boosting",
    "d": "Trees in a row: each one corrects the errors of the previous ones. It is the idea behind XGBoost."
   },
   {
    "c": "model",
    "t": "Naive Bayes",
    "d": "Looks at each feature separately and asks how common that value is in each class; then it combines the clues with probabilities. It is «naive» because it assumes the features are unrelated to each other."
   },
   {
    "c": "cls",
    "t": "Confusion matrix",
    "d": "Table comparing the actual class with the predicted one. TP and TN are hits; FP and FN are errors."
   },
   {
    "c": "cls",
    "t": "Accuracy",
    "d": "Percentage of correct predictions.",
    "f": "Acc = (TP + TN) / (TP + TN + FP + FN)",
    "i": "Can mislead when one class has many more rows than another."
   },
   {
    "c": "cls",
    "t": "Balanced accuracy",
    "d": "Average sensitivity over classes. Fairer when classes are imbalanced."
   },
   {
    "c": "cls",
    "t": "Precision",
    "d": "When the model says “positive”, how often is it right?",
    "f": "PPV = TP / (TP + FP)",
    "i": "Matters when a false alarm is costly."
   },
   {
    "c": "cls",
    "t": "Sensitivity (recall)",
    "d": "Of all actual positives, how many did the model find?",
    "f": "TPR = TP / (TP + FN)",
    "i": "Matters when missing a case is costly."
   },
   {
    "c": "cls",
    "t": "Specificity",
    "d": "Of all actual negatives, how many did the model get right?",
    "f": "TNR = TN / (TN + FP)"
   },
   {
    "c": "cls",
    "t": "F1-score",
    "d": "Combines precision and sensitivity into one number.",
    "f": "F1 = 2 · PPV · TPR / (PPV + TPR)",
    "i": "It is low if either one is low."
   },
   {
    "c": "cls",
    "t": "ROC curve and AUC",
    "d": "The curve shows sensitivity against false alarms as the decision threshold moves. AUC is the area under the curve.",
    "i": "AUC = 0.5 is random guessing; AUC = 1 is perfect."
   },
   {
    "c": "reg",
    "t": "Residual",
    "d": "Difference between the actual and the predicted value.",
    "f": "eᵢ = yᵢ − ŷᵢ"
   },
   {
    "c": "reg",
    "t": "R²",
    "d": "How much of the target's variation the model explains.",
    "f": "R² = 1 − Σ(yᵢ − ŷᵢ)² / Σ(yᵢ − ȳ)²",
    "i": "1 is perfect; 0 is the same as always predicting the average."
   },
   {
    "c": "reg",
    "t": "MAE (mean absolute error)",
    "d": "On average, how far off the model is.",
    "f": "MAE = (1/n) Σ |yᵢ − ŷᵢ|",
    "i": "It is in the same units as the target."
   },
   {
    "c": "reg",
    "t": "MSE (mean squared error)",
    "d": "Average of the squared errors.",
    "f": "MSE = (1/n) Σ (yᵢ − ŷᵢ)²",
    "i": "Punishes large errors more."
   },
   {
    "c": "reg",
    "t": "MAPE (mean percentage error)",
    "d": "On average, by what percentage the model is off.",
    "f": "MAPE = (100 % / n) Σ |(yᵢ − ŷᵢ) / yᵢ|"
   }
  ]
 }
};
window.GLOSSARY.es.items.splice(window.GLOSSARY.es.items.findIndex(x => x.c === "model"), 0, { c: "prep", t: "PCA (componentes principales)", d: "Resume muchas features en dos o tres ejes nuevos que conservan la mayor parte de la variación. Sirve para dibujar los datos." });
window.GLOSSARY.en.items.splice(window.GLOSSARY.en.items.findIndex(x => x.c === "model"), 0, { c: "prep", t: "PCA (principal components)", d: "Summarizes many features into two or three new axes that keep most of the variation. Useful for drawing the data." });
window.GLOSSARY.es.items.splice(window.GLOSSARY.es.items.findIndex(x => x.c === "prep"), 0, { c: "prep", t: "Validación de datos (esquema)", d: "Revisar que cada columna cumpla reglas antes de entrenar: tipo, vacíos permitidos, mínimo, máximo y valores permitidos. En Python se hace con librerías como Pandera.", i: "Detecta errores de captura antes de que el modelo los aprenda." });
window.GLOSSARY.en.items.splice(window.GLOSSARY.en.items.findIndex(x => x.c === "prep"), 0, { c: "prep", t: "Data validation (schema)", d: "Checking that every column follows rules before training: type, allowed empty cells, minimum, maximum and allowed values. In Python it is done with libraries such as Pandera.", i: "It catches data-entry errors before the model learns them." });
/* MATHML (generado por scripts/build_math.js) */
window.GLOSSARY_MATH = {"x̂ = (1/n) Σ xᵢ   ó   x̂ = mediana(x)":"<span class=\"katex\"><math xmlns=\"http://www.w3.org/1998/Math/MathML\" display=\"block\"><semantics><mtable rowspacing=\"0.25em\" columnalign=\"center\" columnspacing=\"0em\"><mtr><mtd><mstyle scriptlevel=\"0\" displaystyle=\"true\"><mrow><mover accent=\"true\"><mi>x</mi><mo>^</mo></mover><mo>=</mo><mfrac><mn>1</mn><mi>n</mi></mfrac><munderover><mo>∑</mo><mrow><mi>i</mi><mo>=</mo><mn>1</mn></mrow><mi>n</mi></munderover><msub><mi>x</mi><mi>i</mi></msub></mrow></mstyle></mtd></mtr><mtr><mtd><mstyle scriptlevel=\"0\" displaystyle=\"true\"><mrow><mover accent=\"true\"><mi>x</mi><mo>^</mo></mover><mo>=</mo><mi mathvariant=\"normal\">mediana</mi><mo>⁡</mo><mo stretchy=\"false\">(</mo><mi>x</mi><mo stretchy=\"false\">)</mo></mrow></mstyle></mtd></mtr></mtable><annotation encoding=\"application/x-tex\">\\begin{gathered} \\hat{x} = \\frac{1}{n}\\sum_{i=1}^{n} x_i \\\\ \\hat{x} = \\operatorname{mediana}(x) \\end{gathered}</annotation></semantics></math></span>","z = (x − μ) / σ":"<span class=\"katex\"><math xmlns=\"http://www.w3.org/1998/Math/MathML\" display=\"block\"><semantics><mrow><mi>z</mi><mo>=</mo><mfrac><mrow><mi>x</mi><mo>−</mo><mi>μ</mi></mrow><mi>σ</mi></mfrac></mrow><annotation encoding=\"application/x-tex\">z = \\frac{x - \\mu}{\\sigma}</annotation></semantics></math></span>","x′ = (x − mín) / (máx − mín)":"<span class=\"katex\"><math xmlns=\"http://www.w3.org/1998/Math/MathML\" display=\"block\"><semantics><mrow><msup><mi>x</mi><mo mathvariant=\"normal\" lspace=\"0em\" rspace=\"0em\">′</mo></msup><mo>=</mo><mfrac><mrow><mi>x</mi><mo>−</mo><msub><mi>x</mi><mi>min</mi><mo>⁡</mo></msub></mrow><mrow><msub><mi>x</mi><mi>max</mi><mo>⁡</mo></msub><mo>−</mo><msub><mi>x</mi><mi>min</mi><mo>⁡</mo></msub></mrow></mfrac></mrow><annotation encoding=\"application/x-tex\">x&#x27; = \\frac{x - x_{\\min}}{x_{\\max} - x_{\\min}}</annotation></semantics></math></span>","ŷ = β₀ + β₁x₁ + β₂x₂ + …":"<span class=\"katex\"><math xmlns=\"http://www.w3.org/1998/Math/MathML\" display=\"block\"><semantics><mrow><mover accent=\"true\"><mi>y</mi><mo>^</mo></mover><mo>=</mo><msub><mi>β</mi><mn>0</mn></msub><mo>+</mo><msub><mi>β</mi><mn>1</mn></msub><msub><mi>x</mi><mn>1</mn></msub><mo>+</mo><msub><mi>β</mi><mn>2</mn></msub><msub><mi>x</mi><mn>2</mn></msub><mo>+</mo><mo>…</mo></mrow><annotation encoding=\"application/x-tex\">\\hat{y} = \\beta_0 + \\beta_1 x_1 + \\beta_2 x_2 + \\dots</annotation></semantics></math></span>","Acc = (VP + VN) / (VP + VN + FP + FN)":"<span class=\"katex\"><math xmlns=\"http://www.w3.org/1998/Math/MathML\" display=\"block\"><semantics><mrow><mtext>Acc</mtext><mo>=</mo><mfrac><mrow><mrow><mi mathvariant=\"normal\">V</mi><mi mathvariant=\"normal\">P</mi></mrow><mo>+</mo><mrow><mi mathvariant=\"normal\">V</mi><mi mathvariant=\"normal\">N</mi></mrow></mrow><mrow><mrow><mi mathvariant=\"normal\">V</mi><mi mathvariant=\"normal\">P</mi></mrow><mo>+</mo><mrow><mi mathvariant=\"normal\">V</mi><mi mathvariant=\"normal\">N</mi></mrow><mo>+</mo><mrow><mi mathvariant=\"normal\">F</mi><mi mathvariant=\"normal\">P</mi></mrow><mo>+</mo><mrow><mi mathvariant=\"normal\">F</mi><mi mathvariant=\"normal\">N</mi></mrow></mrow></mfrac></mrow><annotation encoding=\"application/x-tex\">\\text{Acc} = \\frac{\\mathrm{VP} + \\mathrm{VN}}{\\mathrm{VP} + \\mathrm{VN} + \\mathrm{FP} + \\mathrm{FN}}</annotation></semantics></math></span>","PPV = VP / (VP + FP)":"<span class=\"katex\"><math xmlns=\"http://www.w3.org/1998/Math/MathML\" display=\"block\"><semantics><mrow><mrow><mi mathvariant=\"normal\">P</mi><mi mathvariant=\"normal\">P</mi><mi mathvariant=\"normal\">V</mi></mrow><mo>=</mo><mfrac><mrow><mi mathvariant=\"normal\">V</mi><mi mathvariant=\"normal\">P</mi></mrow><mrow><mrow><mi mathvariant=\"normal\">V</mi><mi mathvariant=\"normal\">P</mi></mrow><mo>+</mo><mrow><mi mathvariant=\"normal\">F</mi><mi mathvariant=\"normal\">P</mi></mrow></mrow></mfrac></mrow><annotation encoding=\"application/x-tex\">\\mathrm{PPV} = \\frac{\\mathrm{VP}}{\\mathrm{VP} + \\mathrm{FP}}</annotation></semantics></math></span>","TPR = VP / (VP + FN)":"<span class=\"katex\"><math xmlns=\"http://www.w3.org/1998/Math/MathML\" display=\"block\"><semantics><mrow><mrow><mi mathvariant=\"normal\">T</mi><mi mathvariant=\"normal\">P</mi><mi mathvariant=\"normal\">R</mi></mrow><mo>=</mo><mfrac><mrow><mi mathvariant=\"normal\">V</mi><mi mathvariant=\"normal\">P</mi></mrow><mrow><mrow><mi mathvariant=\"normal\">V</mi><mi mathvariant=\"normal\">P</mi></mrow><mo>+</mo><mrow><mi mathvariant=\"normal\">F</mi><mi mathvariant=\"normal\">N</mi></mrow></mrow></mfrac></mrow><annotation encoding=\"application/x-tex\">\\mathrm{TPR} = \\frac{\\mathrm{VP}}{\\mathrm{VP} + \\mathrm{FN}}</annotation></semantics></math></span>","TNR = VN / (VN + FP)":"<span class=\"katex\"><math xmlns=\"http://www.w3.org/1998/Math/MathML\" display=\"block\"><semantics><mrow><mrow><mi mathvariant=\"normal\">T</mi><mi mathvariant=\"normal\">N</mi><mi mathvariant=\"normal\">R</mi></mrow><mo>=</mo><mfrac><mrow><mi mathvariant=\"normal\">V</mi><mi mathvariant=\"normal\">N</mi></mrow><mrow><mrow><mi mathvariant=\"normal\">V</mi><mi mathvariant=\"normal\">N</mi></mrow><mo>+</mo><mrow><mi mathvariant=\"normal\">F</mi><mi mathvariant=\"normal\">P</mi></mrow></mrow></mfrac></mrow><annotation encoding=\"application/x-tex\">\\mathrm{TNR} = \\frac{\\mathrm{VN}}{\\mathrm{VN} + \\mathrm{FP}}</annotation></semantics></math></span>","F1 = 2 · PPV · TPR / (PPV + TPR)":"<span class=\"katex\"><math xmlns=\"http://www.w3.org/1998/Math/MathML\" display=\"block\"><semantics><mrow><msub><mi>F</mi><mn>1</mn></msub><mo>=</mo><mn>2</mn><mo>⋅</mo><mfrac><mrow><mrow><mi mathvariant=\"normal\">P</mi><mi mathvariant=\"normal\">P</mi><mi mathvariant=\"normal\">V</mi></mrow><mo>⋅</mo><mrow><mi mathvariant=\"normal\">T</mi><mi mathvariant=\"normal\">P</mi><mi mathvariant=\"normal\">R</mi></mrow></mrow><mrow><mrow><mi mathvariant=\"normal\">P</mi><mi mathvariant=\"normal\">P</mi><mi mathvariant=\"normal\">V</mi></mrow><mo>+</mo><mrow><mi mathvariant=\"normal\">T</mi><mi mathvariant=\"normal\">P</mi><mi mathvariant=\"normal\">R</mi></mrow></mrow></mfrac></mrow><annotation encoding=\"application/x-tex\">F_1 = 2 \\cdot \\frac{\\mathrm{PPV} \\cdot \\mathrm{TPR}}{\\mathrm{PPV} + \\mathrm{TPR}}</annotation></semantics></math></span>","eᵢ = yᵢ − ŷᵢ":"<span class=\"katex\"><math xmlns=\"http://www.w3.org/1998/Math/MathML\" display=\"block\"><semantics><mrow><msub><mi>e</mi><mi>i</mi></msub><mo>=</mo><msub><mi>y</mi><mi>i</mi></msub><mo>−</mo><msub><mover accent=\"true\"><mi>y</mi><mo>^</mo></mover><mi>i</mi></msub></mrow><annotation encoding=\"application/x-tex\">e_i = y_i - \\hat{y}_i</annotation></semantics></math></span>","R² = 1 − Σ(yᵢ − ŷᵢ)² / Σ(yᵢ − ȳ)²":"<span class=\"katex\"><math xmlns=\"http://www.w3.org/1998/Math/MathML\" display=\"block\"><semantics><mrow><msup><mi>R</mi><mn>2</mn></msup><mo>=</mo><mn>1</mn><mo>−</mo><mfrac><mrow><munder><mo>∑</mo><mi>i</mi></munder><mo stretchy=\"false\">(</mo><msub><mi>y</mi><mi>i</mi></msub><mo>−</mo><msub><mover accent=\"true\"><mi>y</mi><mo>^</mo></mover><mi>i</mi></msub><msup><mo stretchy=\"false\">)</mo><mn>2</mn></msup></mrow><mrow><munder><mo>∑</mo><mi>i</mi></munder><mo stretchy=\"false\">(</mo><msub><mi>y</mi><mi>i</mi></msub><mo>−</mo><mover accent=\"true\"><mi>y</mi><mo>ˉ</mo></mover><msup><mo stretchy=\"false\">)</mo><mn>2</mn></msup></mrow></mfrac></mrow><annotation encoding=\"application/x-tex\">R^2 = 1 - \\frac{\\sum_{i}(y_i - \\hat{y}_i)^2}{\\sum_{i}(y_i - \\bar{y})^2}</annotation></semantics></math></span>","MAE = (1/n) Σ |yᵢ − ŷᵢ|":"<span class=\"katex\"><math xmlns=\"http://www.w3.org/1998/Math/MathML\" display=\"block\"><semantics><mrow><mrow><mi mathvariant=\"normal\">M</mi><mi mathvariant=\"normal\">A</mi><mi mathvariant=\"normal\">E</mi></mrow><mo>=</mo><mfrac><mn>1</mn><mi>n</mi></mfrac><munderover><mo>∑</mo><mrow><mi>i</mi><mo>=</mo><mn>1</mn></mrow><mi>n</mi></munderover><mo stretchy=\"false\">∣</mo><msub><mi>y</mi><mi>i</mi></msub><mo>−</mo><msub><mover accent=\"true\"><mi>y</mi><mo>^</mo></mover><mi>i</mi></msub><mo stretchy=\"false\">∣</mo></mrow><annotation encoding=\"application/x-tex\">\\mathrm{MAE} = \\frac{1}{n}\\sum_{i=1}^{n} \\lvert y_i - \\hat{y}_i \\rvert</annotation></semantics></math></span>","MSE = (1/n) Σ (yᵢ − ŷᵢ)²":"<span class=\"katex\"><math xmlns=\"http://www.w3.org/1998/Math/MathML\" display=\"block\"><semantics><mrow><mrow><mi mathvariant=\"normal\">M</mi><mi mathvariant=\"normal\">S</mi><mi mathvariant=\"normal\">E</mi></mrow><mo>=</mo><mfrac><mn>1</mn><mi>n</mi></mfrac><munderover><mo>∑</mo><mrow><mi>i</mi><mo>=</mo><mn>1</mn></mrow><mi>n</mi></munderover><mo stretchy=\"false\">(</mo><msub><mi>y</mi><mi>i</mi></msub><mo>−</mo><msub><mover accent=\"true\"><mi>y</mi><mo>^</mo></mover><mi>i</mi></msub><msup><mo stretchy=\"false\">)</mo><mn>2</mn></msup></mrow><annotation encoding=\"application/x-tex\">\\mathrm{MSE} = \\frac{1}{n}\\sum_{i=1}^{n} (y_i - \\hat{y}_i)^2</annotation></semantics></math></span>","MAPE = (100 % / n) Σ |(yᵢ − ŷᵢ) / yᵢ|":"<span class=\"katex\"><math xmlns=\"http://www.w3.org/1998/Math/MathML\" display=\"block\"><semantics><mrow><mrow><mi mathvariant=\"normal\">M</mi><mi mathvariant=\"normal\">A</mi><mi mathvariant=\"normal\">P</mi><mi mathvariant=\"normal\">E</mi></mrow><mo>=</mo><mfrac><mrow><mn>100</mn><mi mathvariant=\"normal\">%</mi></mrow><mi>n</mi></mfrac><munderover><mo>∑</mo><mrow><mi>i</mi><mo>=</mo><mn>1</mn></mrow><mi>n</mi></munderover><mrow><mo fence=\"true\">∣</mo><mfrac><mrow><msub><mi>y</mi><mi>i</mi></msub><mo>−</mo><msub><mover accent=\"true\"><mi>y</mi><mo>^</mo></mover><mi>i</mi></msub></mrow><msub><mi>y</mi><mi>i</mi></msub></mfrac><mo fence=\"true\">∣</mo></mrow></mrow><annotation encoding=\"application/x-tex\">\\mathrm{MAPE} = \\frac{100\\%}{n}\\sum_{i=1}^{n} \\left\\lvert \\frac{y_i - \\hat{y}_i}{y_i} \\right\\rvert</annotation></semantics></math></span>","x̂ = (1/n) Σ xᵢ   or   x̂ = median(x)":"<span class=\"katex\"><math xmlns=\"http://www.w3.org/1998/Math/MathML\" display=\"block\"><semantics><mtable rowspacing=\"0.25em\" columnalign=\"center\" columnspacing=\"0em\"><mtr><mtd><mstyle scriptlevel=\"0\" displaystyle=\"true\"><mrow><mover accent=\"true\"><mi>x</mi><mo>^</mo></mover><mo>=</mo><mfrac><mn>1</mn><mi>n</mi></mfrac><munderover><mo>∑</mo><mrow><mi>i</mi><mo>=</mo><mn>1</mn></mrow><mi>n</mi></munderover><msub><mi>x</mi><mi>i</mi></msub></mrow></mstyle></mtd></mtr><mtr><mtd><mstyle scriptlevel=\"0\" displaystyle=\"true\"><mrow><mover accent=\"true\"><mi>x</mi><mo>^</mo></mover><mo>=</mo><mi mathvariant=\"normal\">median</mi><mo>⁡</mo><mo stretchy=\"false\">(</mo><mi>x</mi><mo stretchy=\"false\">)</mo></mrow></mstyle></mtd></mtr></mtable><annotation encoding=\"application/x-tex\">\\begin{gathered} \\hat{x} = \\frac{1}{n}\\sum_{i=1}^{n} x_i \\\\ \\hat{x} = \\operatorname{median}(x) \\end{gathered}</annotation></semantics></math></span>","x′ = (x − min) / (max − min)":"<span class=\"katex\"><math xmlns=\"http://www.w3.org/1998/Math/MathML\" display=\"block\"><semantics><mrow><msup><mi>x</mi><mo mathvariant=\"normal\" lspace=\"0em\" rspace=\"0em\">′</mo></msup><mo>=</mo><mfrac><mrow><mi>x</mi><mo>−</mo><msub><mi>x</mi><mi>min</mi><mo>⁡</mo></msub></mrow><mrow><msub><mi>x</mi><mi>max</mi><mo>⁡</mo></msub><mo>−</mo><msub><mi>x</mi><mi>min</mi><mo>⁡</mo></msub></mrow></mfrac></mrow><annotation encoding=\"application/x-tex\">x&#x27; = \\frac{x - x_{\\min}}{x_{\\max} - x_{\\min}}</annotation></semantics></math></span>","Acc = (TP + TN) / (TP + TN + FP + FN)":"<span class=\"katex\"><math xmlns=\"http://www.w3.org/1998/Math/MathML\" display=\"block\"><semantics><mrow><mtext>Acc</mtext><mo>=</mo><mfrac><mrow><mrow><mi mathvariant=\"normal\">T</mi><mi mathvariant=\"normal\">P</mi></mrow><mo>+</mo><mrow><mi mathvariant=\"normal\">T</mi><mi mathvariant=\"normal\">N</mi></mrow></mrow><mrow><mrow><mi mathvariant=\"normal\">T</mi><mi mathvariant=\"normal\">P</mi></mrow><mo>+</mo><mrow><mi mathvariant=\"normal\">T</mi><mi mathvariant=\"normal\">N</mi></mrow><mo>+</mo><mrow><mi mathvariant=\"normal\">F</mi><mi mathvariant=\"normal\">P</mi></mrow><mo>+</mo><mrow><mi mathvariant=\"normal\">F</mi><mi mathvariant=\"normal\">N</mi></mrow></mrow></mfrac></mrow><annotation encoding=\"application/x-tex\">\\text{Acc} = \\frac{\\mathrm{TP} + \\mathrm{TN}}{\\mathrm{TP} + \\mathrm{TN} + \\mathrm{FP} + \\mathrm{FN}}</annotation></semantics></math></span>","PPV = TP / (TP + FP)":"<span class=\"katex\"><math xmlns=\"http://www.w3.org/1998/Math/MathML\" display=\"block\"><semantics><mrow><mrow><mi mathvariant=\"normal\">P</mi><mi mathvariant=\"normal\">P</mi><mi mathvariant=\"normal\">V</mi></mrow><mo>=</mo><mfrac><mrow><mi mathvariant=\"normal\">T</mi><mi mathvariant=\"normal\">P</mi></mrow><mrow><mrow><mi mathvariant=\"normal\">T</mi><mi mathvariant=\"normal\">P</mi></mrow><mo>+</mo><mrow><mi mathvariant=\"normal\">F</mi><mi mathvariant=\"normal\">P</mi></mrow></mrow></mfrac></mrow><annotation encoding=\"application/x-tex\">\\mathrm{PPV} = \\frac{\\mathrm{TP}}{\\mathrm{TP} + \\mathrm{FP}}</annotation></semantics></math></span>","TPR = TP / (TP + FN)":"<span class=\"katex\"><math xmlns=\"http://www.w3.org/1998/Math/MathML\" display=\"block\"><semantics><mrow><mrow><mi mathvariant=\"normal\">T</mi><mi mathvariant=\"normal\">P</mi><mi mathvariant=\"normal\">R</mi></mrow><mo>=</mo><mfrac><mrow><mi mathvariant=\"normal\">T</mi><mi mathvariant=\"normal\">P</mi></mrow><mrow><mrow><mi mathvariant=\"normal\">T</mi><mi mathvariant=\"normal\">P</mi></mrow><mo>+</mo><mrow><mi mathvariant=\"normal\">F</mi><mi mathvariant=\"normal\">N</mi></mrow></mrow></mfrac></mrow><annotation encoding=\"application/x-tex\">\\mathrm{TPR} = \\frac{\\mathrm{TP}}{\\mathrm{TP} + \\mathrm{FN}}</annotation></semantics></math></span>","TNR = TN / (TN + FP)":"<span class=\"katex\"><math xmlns=\"http://www.w3.org/1998/Math/MathML\" display=\"block\"><semantics><mrow><mrow><mi mathvariant=\"normal\">T</mi><mi mathvariant=\"normal\">N</mi><mi mathvariant=\"normal\">R</mi></mrow><mo>=</mo><mfrac><mrow><mi mathvariant=\"normal\">T</mi><mi mathvariant=\"normal\">N</mi></mrow><mrow><mrow><mi mathvariant=\"normal\">T</mi><mi mathvariant=\"normal\">N</mi></mrow><mo>+</mo><mrow><mi mathvariant=\"normal\">F</mi><mi mathvariant=\"normal\">P</mi></mrow></mrow></mfrac></mrow><annotation encoding=\"application/x-tex\">\\mathrm{TNR} = \\frac{\\mathrm{TN}}{\\mathrm{TN} + \\mathrm{FP}}</annotation></semantics></math></span>"};
