const { filter } = require('domutils')
const TelegramBot = require('node-telegram-bot-api')
const parser = require('../parser')

module.exports = class Bot {
  state = {
    costDirection: [],
    costConcreteDirection: [],
    planDirection: [],
    planConcreteDirection: []
  }

  constructor(token) {
    const eventEmitter = new TelegramBot.EventEmitter()
    eventEmitter.on('cost_event', async (args) => {
      if (this.state.costDirection.length === 0) return

      const number = parseInt(args[0])
      const msg = args[1]

      const url = this.state.costDirection[number]
      const costs = JSON.parse(await parser.getCosts(url))
      const res = Object.keys(costs)
      this.state.costConcreteDirection = Object.values(costs)

      let btns = res.map((text, i) => {
        return { text: (i + 1).toString(), callback_data: `cost_concrete::${i}` }
      })
      const lineButtons = []
      while (btns.length > 0) {
        lineButtons.push(btns.slice(0, 4))
        btns = btns.slice(4)
      }
      await this.bot.sendMessage(msg.chat.id, 'Выбери направление\n' + res.map((text, i) => `${i + 1} - ${text}`).join('\n'), {
        'reply_markup': {
          'inline_keyboard': [
            ...lineButtons
          ]
        }
      })
    })

    eventEmitter.on('cost_concrete', async (args) => {
      if (this.state.costConcreteDirection.length === 0) return

      const number = parseInt(args[0])
      const msg = args[1]
      this.bot.sendMessage(msg.chat.id, this.state.costConcreteDirection[number])
    })

    eventEmitter.on('plan_event', async (args) => {
      if (this.state.planDirection.length === 0) return

      const number = parseInt(args[0])
      const msg = args[1]

      const url = this.state.planDirection[number]
      const costs = JSON.parse(await parser.getStudyPlanConcreteDirection(url))
      const res = Object.keys(costs)
      this.state.planConcreteDirection = Object.values(costs)

      let btns = res.map((text, i) => {
        return { text: (i + 1).toString(), 'url': this.state.planConcreteDirection[i] }
      })
      const lineButtons = []
      while (btns.length > 0) {
        lineButtons.push(btns.slice(0, 4))
        btns = btns.slice(4)
      }
      
      let text = 'Выбери институт\n' + res.map((text, i) => `${i + 1} - ${text}`).join('\n')
      let textOverflow = ''
      if (text.length > 3000) {
        let newLineIndex = text.substring(0, 3000).lastIndexOf('\n')
        textOverflow = text.substring(newLineIndex)
        text = text.substring(0, newLineIndex)
      }

      await this.bot.sendMessage(msg.chat.id, text)
      await this.bot.sendMessage(msg.chat.id, textOverflow, {
        'parse_mode': 'markdown',
        'reply_markup': {
          'inline_keyboard': [
            ...lineButtons
          ]
        }
      })
    })

    this.token = token
    this.bot = new TelegramBot(this.token, { polling: true })

    this.bot.on('callback_query', callbackQuery => {
      const idButton = callbackQuery.data.split('::')[1]
      console.log(callbackQuery)
      eventEmitter.emit(callbackQuery.data.split('::')[0], [idButton, callbackQuery.message])
    })

    this.mainMenu()
    this.showMenuPlan()
  }

  mainMenu() {
    this.bot.onText(/\/start/, msg => {
      this.state = {
        costDirection: [],
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
      const res = Object.keys(field)
      this.state.costDirection = Object.values(field)
      let btns = res.map((text, i) => {
        return { text: (i + 1).toString(), callback_data: `cost_event::${i}` }
      })
      const lineButtons = []
      while (btns.length > 0) {
        lineButtons.push(btns.slice(0, 4))
        btns = btns.slice(4)
      }

      let text = 'Выбери институт\n' + res.map((text, i) => `${i + 1} - ${text}`).join('\n')
      await this.bot.sendMessage(msg.chat.id, text, {
        'reply_markup': {
          'inline_keyboard': [
            ...lineButtons
          ]
        }
      })
    })
  }

  showMenuPlan() {
    this.bot.onText(/План обучения/, async msg => {
      const field = JSON.parse(await parser.getStudyPlanDirection())
      const res = Object.keys(field)
      this.state.planDirection = Object.values(field)
      let btns = res.map((text, i) => {
        return { text: (i + 1).toString(), callback_data: `plan_event::${i}` }
      })
      const lineButtons = []
      while (btns.length > 0) {
        lineButtons.push(btns.slice(0, 4))
        btns = btns.slice(4)
      }

      await this.bot.sendMessage(msg.chat.id, 'Выбери направление\n' + res.map((text, i) => `${i + 1} - ${text}`).join('\n'), {
        'reply_markup': {
          'inline_keyboard': [
            ...lineButtons
          ]
        }
      })
    })
  }
}