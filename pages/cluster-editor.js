class ClusterEditorPage extends Sidebar{
    constructor(origin = 'right', widthPercentage = 30){
        super(origin, widthPercentage)
        
        this._title='clusters'

        this.render()
    }



    content(){
        let div = document.createElement('div')
        div.textContent='conteudo'
        return div
    }

    render(){
        this.show(this.content())
    }
}