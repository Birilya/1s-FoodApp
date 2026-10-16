const express = require('express')
const sqlite3 = require('sqlite3').verbose()
const cors = require('cors')

const app = express()
const db = new sqlite3.Database('food.db')

app.use(cors())
app.use(express.json())

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      calories REAL
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS diary (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      calories REAL,
      date TEXT
    )
  `)
})

// Получить продукты
app.get('/products', (req, res) => {
  db.all('SELECT * FROM products', (err, rows) => {
    res.json(rows)
  })
})

// Добавить продукт
app.post('/products', (req, res) => {
  const { name, calories } = req.body

  db.run(
    'INSERT INTO products (name, calories) VALUES (?, ?)',
    [name, calories],
    function () {
      res.json({ id: this.lastID, name, calories })
    },
  )
})

// Удалить продукт
app.delete('/products/:id', (req, res) => {
  db.run('DELETE FROM products WHERE id = ?', [req.params.id], () => {
    res.sendStatus(200)
  })
})

// Изменить продукт
app.put('/products/:id', (req, res) => {
  const { name } = req.body

  db.run(
    'UPDATE products SET name = ? WHERE id = ?',
    [name, req.params.id],
    function (err) {
      if (err) {
        res.status(500).send(err.message)
        return
      }

      if (this.changes === 0) {
        res.status(404).send('Продукт не найден')
        return
      }

      res.sendStatus(200)
    },
  )
})


// Получить дневник за день
app.get('/diary', (req, res) => {
  db.all(
    'SELECT * FROM diary WHERE date = ?',
    [req.query.date],
    (err, rows) => {
      res.json(rows)
    },
  )
})

// Добавить запись в дневник
app.post('/diary', (req, res) => {
  const { name, calories, date } = req.body

  db.run(
    'INSERT INTO diary (name, calories, date) VALUES (?, ?, ?)',
    [name, calories, date],
    function () {
      res.json({ id: this.lastID, name, calories, date })
    },
  )
})

// Удалить запись из дневника
app.delete('/diary/:id', (req, res) => {
  db.run('DELETE FROM diary WHERE id = ?', [req.params.id], () => {
    res.sendStatus(200)
  })
})

// Статистика
app.get('/statistics', (req, res) => {
  db.all(
    `SELECT date, SUM(calories) AS calories
     FROM diary
     GROUP BY date
     ORDER BY date`,
    (err, rows) => {
      res.json(rows)
    },
  )
})

app.listen(3001, () => {
  console.log('Server started')
})
