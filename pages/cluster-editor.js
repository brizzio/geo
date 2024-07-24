class ClusterEditorPage extends Sidebar{
    constructor(tenant, origin = 'right', widthPercentage = 30){
        super(origin, widthPercentage)
        this._title='clusters'
        this._cluster = new ClusterModel({tenant_id:tenant})
        this.render()
    }



    content(){
        let div = document.createElement('div')
        div.style.cssText=`
            display: flex;
            flex-direction: column; /* Align items in column */
            width: 100%;
            height: : 100%;
            padding: 10px;
        `
        div.appendChild(ClusterModel.selector(this._cluster))

        return div
    }

    render(){
        this.show(this.content())
    }
}