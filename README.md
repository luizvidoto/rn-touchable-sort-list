## React Native Sort List

This is a beta package, some issues may appear!  
It should work with Redux and normal state for changes.

### Installation

```sh
npm install rn-touchable-sort-list --save
yarn add rn-touchable-sort-list
```

### Usage of Touchable Sort List

Usage is similar to FlatList, you should use a function to render items.
`DATA` must be an array of object with **id** and **order** properties, otherwise it won't work.

```js
class Main extends Component {
    state = {
        data: T[] = [
            {id: 'ID1', order: 0, title: 'Some Text', ...},
            {id: 'ID2', order: 1, title: 'Another Text', ...},
            {id: 'ID3', order: 2, title: 'Lorem Text', ...},
            ...
        ]
    }
    renderRow = (item: T, isActive: boolean, isTarget: boolean) => {
        return (
            <View style={{backgroundColor: isActive ? 'green' : 'white'}}>
                <Text>
                    {item.title}
                </Text>
            </View>
        )
    }
    onItemActivation = (item: T) => {
        console.log(item)
    }
    onOrderChange = (newData: T[]) => {
        this.setState({data: newData})
    }
    render() {
        return (
            <TouchableSortList
                data={this.state.data}
                renderRow={this.renderRow}
                onItemActivation={this.onItemActivation}
                onOrderChange={this.onOrderChange}
            />
        )
    }
}
```

### API

##### Props

- **data**: Array of objects that must have {id: string, order: number}  
  `item = T = {id: string, order: number, ...}`  
  `data = T[] = [item1, item2, item3, ...]`
- **renderRow**: Function that receives item, isActive and isTarget values and render it's children.  
  `(item: T, isActive: boolean, isTarget: boolean) => ReactChild`
- **onItemActivation**?: Optional function that receives the item that is moving/active.  
  `(item: T) => void`
- **onOrderChange**: A function that receives the input data but with the order values changed.  
  `(newData: T[]) => void`
