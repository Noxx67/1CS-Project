
import './AcademicDetails.css';
export function AcademicDetails() {
    return (
        <div className='academic-container'>
            <div className='texts' >

                <div >
                    <div>
                        Academic Details.
                    </div>
                    <div>
                        Specific fields for the Student role.
                    </div>
                </div>


                <button className='button'>Student Active</button>
            </div>

            <div className='information'>


                <div>
                    <div>
                        Registration Number
                    </div>
                    <input type="text" className='input-text' defaultValue="2024/0001" />
                </div>
                <div>
                    <div>
                        Promotion / Year
                    </div>
                    <div>
                        <input type="text" className='input-text' list="year" />
                        <datalist id="year">
                            <option value="1CPI" />
                            <option value="2CPI" />
                            <option value="1SC" />
                            <option value="2SC" />
                            <option value="3SC" />
                        </datalist>
                    </div>

                </div>
                <div>
                    <div>
                        Speciality
                    </div>
                    <input type="text" className='input-text' value="Computer Science" readOnly />
                </div>
            </div>
        </div>
    )
}