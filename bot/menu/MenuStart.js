const parser = require('/parser')

export default class MenuStart {
  constructor() {
    this.menus = [
      ['Стоимость обучения'],
      ['План обучения'], 
      ['Порядок подача документов'], 
      ['Информация о общежетии'], 
      ['Вступительные испытания']
    ]
    this.state = 'start'

    this.onCost()
  }

  onCost() {
    this.bot.onText(/Стоимость обучения/, async msg => {
      const field = JSON.parse(await parser.getFieldsEducation())

      const res = []
      for (const obj of field) res.push([Object.keys(obj)[0]])

      this.state.costDirection = field

      await this.bot.sendMessage(msg.chat.id, 'Выбери направление', {
        'reply_markup': {
          'keyboard': [['/start'], ...res]
        }
      })
      this.state.isCost = true
    })
  }
}