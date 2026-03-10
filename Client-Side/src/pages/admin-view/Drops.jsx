import CommonForm from '@/components/common-components/CommonForm';
import { Button } from '@/components/ui/button'
import { dropFormControls } from '@/config';
import { Sheet } from 'lucide-react';
import React, { Fragment, useState } from 'react'

const Drops = () => {
    const [openCreateDropDialog, setOpenCreateDialog]=useState(false);
    const [formData,setFormData] = useState({
        name: "",
        description: "",
        releaseDate: "",
        endDate: "",
        isPublished: false,
        isArchived: false,
    })

    function onSubmit(){

    }
  return (
    <Fragment>
        <div>
            <Button onClick={()=>setOpenCreateDialog(true)}>Add New Drop</Button>
        </div>
        <div>
            <Sheet open={openCreateDropDialog}
                onOpenChange={()=>{
                    setOpenCreateDialog(false)
                }}
            >
                <SheetContent >
                    <SheetHeader>
                        <SheetTitle>
                            Add New Drop
                        </SheetTitle>
                    </SheetHeader>
                    <div>
                        <CommonForm formControls={dropFormControls} formData={formData} setFormData={setFormData} buttonText="Add Drop" />
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    </Fragment>
  )
}

export default Drops
