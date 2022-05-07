const TelegramBot = require('node-telegram-bot-api')
const parser = require('../parser')

module.exports = class Bot {
  state = {
    isCost: false,
    costDirection: [],
    isCostConcrete: false,
    costConcreteDirection: []
  }

  constructor(token) {
    const eventEmitter = new TelegramBot.EventEmitter()
    eventEmitter.on('cost_event', (e) => {
      console.log(123)
    })

    this.token = token
    this.bot = new TelegramBot(this.token, { polling: true })
    this.bot.on('callback_query', (callbackQuery) => {
      eventEmitter.emit(callbackQuery.data)
      this.bot.answerCallbackQuery(callbackQuery.id, "Hi", false)
   });
    this.mainMenu()
    this.showMenuCost()
    this.costConcreteHandler()
    this.costHandler()
  }

  mainMenu() {
    this.bot.onText(/\/start/, msg => {
      this.state = {
        isCost: false,
        costDirection: [],
        isCostConcrete: false,
        costConcreteDirection: []
      }

      this.bot.sendMessage(msg.chat.id, 'Привет', {
        'reply_markup': {
          'keyboard': [
          ['Стоимость обучения'],
           ['План обучения'], 
           ['Порядок подача документов'], 
           ['Информация о общежетии'], 
           ['Вступительные испытания']
          ]
        }
      })
    })
  }

  showMenuCost() {
    this.bot.onText(/Стоимость обучения/, async msg => {
      const field = JSON.parse(await parser.getFieldsEducation())

      const res = []
      for (const obj of field) res.push([Object.keys(obj)[0]])

      this.state.costDirection = field

      await this.bot.sendMessage(msg.chat.id, 'Выбери направление', {
        'reply_markup': {
          'inline_keyboard': [
            [{text: '/start', callback_data: 'cost_event'}],
          
        ]
        }
      })
      this.state.isCost = true
    })
  }

  costHandler() {
    this.bot.onText(/.*/, async (msg, match) => {
      if (!this.state.isCost) return

      if (this.state.costDirection.filter(obj => Object.keys(obj)[0] === match[0]).length === 0)
        this.bot.sendMessage(msg.chat.id, 'Такое направление не найдено')

      const linkOnDoc = this.state.costDirection.find(item => Object.keys(item)[0] === match[0])[match[0]]
      this.getCost(msg.chat.id, linkOnDoc);
    })
  }

  costConcreteHandler() {
    this.bot.onText(/.*/, async (msg, match) => {
      if (!this.state.isCostConcrete) return

      if (this.state.costConcreteDirection.filter(obj => Object.keys(obj)[0] === match[0]).length === 0)
        this.bot.sendMessage(msg.chat.id, 'Такое направление не найдено')

      const cost = this.state.costConcreteDirection.find(item => Object.keys(item)[0] === match[0])[match[0]]

      this.bot.sendMessage(msg.chat.id, cost)
    })
  }

  async getCost(id, url) {
    const costs = JSON.parse(await parser.getCosts(url))
    const res = []
    for (const obj of costs) res.push([Object.keys(obj)[0]])

    this.state.costConcreteDirection = costs
    this.state.isCost = false
    this.state.isCostConcrete = true

    await this.bot.sendMessage(id, 'Выбери направление', {
      'reply_markup': {
        'keyboard': [['/start'], ...res]
      }
    })
  }
}