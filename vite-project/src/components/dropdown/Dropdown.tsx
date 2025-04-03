import { invoke } from '@tauri-apps/api/core'
import style from './Dropdown.module.css'
import { useEffect, useState } from 'react'

export default function Dropdown({setSelectedModel} : {setSelectedModel: (s: string) => void}) {
    const [modelNames, setModelNames] = useState<string[]>([]);

    const fetchModelNames = async () => {
        try {
            const modelNameList = await invoke('get_modals');
            setModelNames(modelNameList as string[]);
        } catch (error) {
            console.error('Error fetching model names:', error);
        }
    }

    useEffect(() => {
        fetchModelNames();
    }, [])
    

    return (
        <select className={style.container} onChange={(e) => setSelectedModel(e.target.value)}>
            <option value={''}>Select Model</option>
            {modelNames.map((name, index) => (
                <option key={index} value={name}>{name}</option>
            ))}
        </select>
    )
}