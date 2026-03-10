import React, { Fragment, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import CommonForm from '@/components/common-components/CommonForm'
import { dropFormControls } from '@/config'

const initialFormData = {
    name: "",
    description: "",
    releaseDate: "",
    endDate: "",
    isPublished: false,
    isArchived: false,
}

const Drops = () => {
    const [openCreateDropDialog, setOpenCreateDialog] = useState(false);
    const [formData, setFormData] = useState(initialFormData);
    const [dropList, setDropList] = useState([]); // Local state until API is ready

    function onSubmit(event) {
        event.preventDefault();
        // Here we would typically make an API call
        // For now, we'll update the local state to show the UI
        const newDrop = { ...formData, id: Date.now() };
        setDropList([...dropList, newDrop]);
        setOpenCreateDialog(false);
        setFormData(initialFormData);
        console.log("Submit logic executed", newDrop);
    }

    return (
        <Fragment>
            <div className="mb-5 flex w-full justify-between items-center">
                <h1 className="text-2xl font-bold">All Drops</h1>
                <Button onClick={() => setOpenCreateDialog(true)}>Add New Drop</Button>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {dropList && dropList.length > 0 ? (
                    dropList.map((drop) => (
                        <div key={drop.id} className="bg-card text-card-foreground shadow-sm rounded-lg border p-4">
                            <h3 className="text-lg font-semibold">{drop.name}</h3>
                            <p className="text-sm text-muted-foreground mt-1 mb-2">
                                {drop.description}
                            </p>
                            <div className="flex flex-col gap-1 text-xs">
                                <span>Start: {new Date(drop.releaseDate).toLocaleString()}</span>
                                <div className="mt-2 flex gap-2">
                                    <span className={`px-2 py-1 rounded-full text-xs ${drop.isPublished ? "bg-green-500/20 text-green-500" : "bg-yellow-500/20 text-yellow-500"}`}>
                                        {drop.isPublished ? "Published" : "Draft"}
                                    </span>
                                    {drop.isArchived && (
                                         <span className="px-2 py-1 rounded-full text-xs bg-gray-500/20 text-gray-500">
                                            Archived
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                   <div className="col-span-full text-center text-muted-foreground py-10">
                        No drops found. Click "Add New Drop" to create one.
                    </div>
                )}
            </div>

            <Sheet open={openCreateDropDialog}
                onOpenChange={(isOpen) => {
                    setOpenCreateDialog(isOpen)
                    if(!isOpen) setFormData(initialFormData);
                }}
            >
                <SheetContent className="overflow-auto bg-background">
                    <SheetHeader className="mb-6">
                        <SheetTitle>
                            Add New Drop
                        </SheetTitle>
                    </SheetHeader>
                    <div>
                        <CommonForm 
                            formControls={dropFormControls} 
                            formData={formData} 
                            setFormData={setFormData} 
                            buttonText="Add Drop"
                            onSubmit={onSubmit}
                        />
                    </div>
                </SheetContent>
            </Sheet>
        </Fragment>
    )
}

export default Drops
