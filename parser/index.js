const cheerio = require('cheerio')
const axios = require('axios').default
const downloadFile = require('./utils/downloadFile')
const docxParser = require('docx-parser')

class Parser {
  root = 'https://www.istu.edu'
  costUrl = this.root + '/abiturientu/nabor_2022/stoimost'
  planUrl = this.root + '/abiturientu/urovni/up'

  async getStudyPlan(url) {
    const body = await axios.get(url)
    const $ = cheerio.load(body.data)
  }

  async getStudyPlanConcreteDirection(url) {
    const body = await axios.get(url)
    const $ = cheerio.load(body.data)

    const study = {}
    $('.content ul')[0].children.forEach(item => {
      if (!item.tagName) return

      const link = $(item).children('a')
      const field = link.text()
      const linkOnPlan = this.root + link.attr().href

      study[field] = linkOnPlan
    })
    return JSON.stringify(study)
  }

  async getStudyPlanDirection() {
    const body = await axios.get(this.planUrl)
    const $ = cheerio.load(body.data)

    const getStudyPlan = {}
    $('.content ul')[0].children.forEach(item => {
      if (!item.tagName) return

      const link = $(item).children('a')
      const field = link.text()
      const linkOnPlan = this.root + link.attr().href

      getStudyPlan[field] = linkOnPlan
    })

    return JSON.stringify(getStudyPlan)
  }

  async getFieldsEducation() {
    const body = await axios.get(this.costUrl)
    const $ = cheerio.load(body.data)

    const fieldsEducation = {}

    $('.content ul')[0].children.forEach(item => {
      if (!item.tagName) return
      const link = $(item).children('a')
      const field = link.text()
      const linkOnCost = this.root + link.attr().href

      fieldsEducation[[field]] =  linkOnCost
    })

    return JSON.stringify(fieldsEducation)
  }

  async getCosts(url) {
    console.log('download')
    const path = await downloadFile(url, '../temp')
    console.log('downloaded')
    const text = await new Promise((resolve, reject) => {
      try {
        docxParser.parseDocx(path, data => resolve(data))
      } catch (e) {
        reject(e)
      }
    }).catch(e => console.log(e))
    console.log('get')
    let lines = text.split('\n')
    //получаем индексы строки цен
    let indexCost = lines.map((text, index) => {
      if (text.match(/^\d\d[^%]/)) return index
    }).filter(item => item)
    //до цен идут описание направлений
    indexCost = indexCost.concat(indexCost.map(item => item - 1))
    //выбираем цены и направления
    lines = lines.filter((item, index) => {
      if (indexCost.includes(index)) return item
    })

    const costs = {}
    for (let i = 0; i < lines.length - 1; i += 2) {

      costs[lines[i].trim()] = lines[i + 1].trim() + 'p. За год обучения без скидок'
    }

    return JSON.stringify(costs)
  }
}

module.exports = new Parser()