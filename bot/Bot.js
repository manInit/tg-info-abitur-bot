const { filter } = require('domutils')
const TelegramBot = require('node-telegram-bot-api')
const parser = require('../parser')

module.exports = class Bot {
  constructor(token) {
    this.state = {
      costDirection: [],
      costConcreteDirection: [],
      planDirection: [],
      planConcreteDirection: []
    }

    this.token = token
    this.bot = new TelegramBot(this.token, { polling: true })

    this._setHandlers()
    this.mainMenu()
    this.showMenuPlan()
    this.showMenuCost()
  }

  _setHandlers() {
    this.bot.on('callback_query', callbackQuery => {
      const idButton = callbackQuery.data.split('::')[1]
      eventEmitter.emit(callbackQuery.data.split('::')[0], [idButton, callbackQuery.message])
    })

    const eventEmitter = new TelegramBot.EventEmitter()
    eventEmitter.on('cost_event', this._onCostEvent.bind(this))
    eventEmitter.on('cost_concrete', this._onCostConcrete.bind(this))
    eventEmitter.on('plan_event', this._onPlanEvent.bind(this))
  }

  async _onPlanEvent(args) {
    if (this.state.planDirection.length === 0) return

    const number = parseInt(args[0])
    const msg = args[1]

    const url = this.state.planDirection[number]
    const plans = JSON.parse(await parser.getStudyPlanConcreteDirection(url))
    this.state.planConcreteDirection = Object.values(plans)
    await this._sendData(msg, plans, '', 'Выбери направление', i => ({
      'url': this.state.planConcreteDirection[i]
    }))
  }

  async _onCostConcrete(args) {
    if (this.state.costConcreteDirection.length === 0) return

    const number = parseInt(args[0])
    const msg = args[1]
    this.bot.sendMessage(msg.chat.id, this.state.costConcreteDirection[number])
  }

  async _onCostEvent(args) {
    if (this.state.costDirection.length === 0) return
    console.log('начал')
    const number = parseInt(args[0])
    const msg = args[1]

    const url = this.state.costDirection[number]
    
    const costs = JSON.parse(await parser.getCosts(url))
    this.state.costConcreteDirection = Object.values(costs)
    await this._sendData(msg, costs, 'cost_concrete', 'Выбери направление')
  }

  mainMenu() {
    this.bot.onText(/\/start/, msg => {
      this.bot.sendMessage(msg.chat.id, '', {
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

  showMenuPlan() {
    this.bot.onText(/План обучения/, async msg => {
      const field = JSON.parse(await parser.getStudyPlanDirection())
      this.state.planDirection = Object.values(field)
      await this._sendData(msg, field, 'plan_event', 'Выбери направление')
    })
  }

  showMenuCost() {
    this.bot.onText(/Стоимость обучения/, async msg => {
      const field = JSON.parse(await parser.getFieldsEducation())
      this.state.costDirection = Object.values(field)
      await this._sendData(msg, field, 'cost_event', 'Выбери институт')
    })
  }

  async _sendData(msg, data, eventName, startText, extraBtns = () => ({})) {
    const res = Object.keys(data)
    let btns = res.map((text, i) => (Object.assign({ 
        text: (i + 1).toString(), 
        callback_data: `${eventName}::${i}` 
      }, extraBtns(i)))
    )
    const lineButtons = []
    while (btns.length > 0) {
      lineButtons.push(btns.slice(0, 4))
      btns = btns.slice(4)
    }

    let text = `${startText}\n` + res.map((text, i) => `${i + 1} - ${text}`).join('\n')
    let textOverflow = ''
    if (text.length > 3000) {
      let newLineIndex = text.substring(0, 3000).lastIndexOf('\n')
      textOverflow = text.substring(newLineIndex)
      text = text.substring(0, newLineIndex)
      await this.bot.sendMessage(msg.chat.id, text)
      await this.bot.sendMessage(msg.chat.id, textOverflow, {
        'parse_mode': 'markdown',
        'reply_markup': {
          'inline_keyboard': [
            ...lineButtons
          ]
        }
      })
      return
    }

    await this.bot.sendMessage(msg.chat.id, text, {
      'parse_mode': 'markdown',
      'reply_markup': {
        'inline_keyboard': [
          ...lineButtons
        ]
      }
    })
  }
}